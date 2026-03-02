const Boutique = require("../models/Boutique");
const Box = require("../models/Box");
const Purchase = require("../models/Purchase");
const mongoose = require("mongoose");

exports.listMine = async (req, res) => {
  try {
    const boutiques = await Boutique.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listMineWithBoxFlag = async (req, res) => {
  try {
    const boutiques = await Boutique.find({ owner: req.user._id }).sort({ createdAt: -1 });
    const ids = boutiques.map((b) => b._id);

    const assigned = await Box.find({ boutique: { $in: ids } }).select("boutique");
    const assignedSet = new Set((assigned || []).map((b) => String(b.boutique)));

    const payload = boutiques.map((b) => ({
      ...b.toObject(),
      hasBox: assignedSet.has(String(b._id))
    }));

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Le nom est requis" });
    }

    const boutique = await Boutique.create({
      owner: req.user._id,
      name: name.trim(),
      category: typeof category === "undefined" ? null : category
    });

    res.status(201).json(boutique);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMineById = async (req, res) => {
  try {
    const boutique = await Boutique.findOne({ _id: req.params.id, owner: req.user._id });
    if (!boutique) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }
    res.json(boutique);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardMine = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const months = Math.max(1, Math.min(24, Number(req.query.months) || 6));

    const boutiqueId = typeof req.query.boutiqueId === "string" ? req.query.boutiqueId : "";

    const boutiques = await Boutique.find({ owner: ownerId }).select("_id name category");
    let ids = (boutiques || []).map((b) => b._id);

    if (boutiqueId) {
      if (!mongoose.isValidObjectId(boutiqueId)) {
        return res.status(400).json({ message: "boutiqueId invalide" });
      }
      const allowed = ids.some((id) => String(id) === String(boutiqueId));
      if (!allowed) {
        return res.status(404).json({ message: "Boutique non trouvée" });
      }
      ids = [new mongoose.Types.ObjectId(boutiqueId)];
    }
    if (ids.length === 0) {
      return res.json({
        months,
        series: [],
        topProducts: [],
        kpis: { totalRevenue: 0, totalOrders: 0, totalItems: 0 }
      });
    }

    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);

    const baseMatch = {
      boutique: { $in: ids },
      createdAt: { $gte: start, $lte: end }
    };

    const deliveredMatchStage = [
      {
        $lookup: {
          from: "deliveries",
          localField: "_id",
          foreignField: "purchase",
          as: "delivery"
        }
      },
      {
        $match: {
          "delivery.status": "livre"
        }
      }
    ];

    const [topProducts, monthlyRevenue, globalKpis] = await Promise.all([
      Purchase.aggregate([
        { $match: baseMatch },
        ...deliveredMatchStage,
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.articleId",
            name: { $first: "$items.name" },
            image: { $first: "$items.image" },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            articleId: "$_id",
            name: 1,
            image: 1,
            quantity: 1,
            revenue: 1
          }
        }
      ]),
      Purchase.aggregate([
        { $match: baseMatch },
        ...deliveredMatchStage,
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" }
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } }
      ]),
      Purchase.aggregate([
        { $match: baseMatch },
        ...deliveredMatchStage,
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalOrders: { $addToSet: "$_id" },
            totalItems: { $sum: "$items.quantity" }
          }
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalOrders: { $size: "$totalOrders" },
            totalItems: 1
          }
        }
      ])
    ]);

    const byYm = new Map(
      (monthlyRevenue || []).map((r) => [`${r._id.y}-${String(r._id.m).padStart(2, "0")}`, r])
    );

    const series = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const row = byYm.get(ym);
      series.push({
        ym,
        label: d.toLocaleString("fr-FR", { month: "short", year: "numeric" }),
        revenue: row ? row.revenue : 0,
        orders: row ? row.orders : 0
      });
    }

    const kpis = (globalKpis && globalKpis[0]) || { totalRevenue: 0, totalOrders: 0, totalItems: 0 };

    res.json({ months, series, topProducts, kpis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopBoutiquesByRevenue = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(20, Number(req.query.limit) || 5));

    const rows = await Purchase.aggregate([
      {
        $lookup: {
          from: "deliveries",
          localField: "_id",
          foreignField: "purchase",
          as: "delivery"
        }
      },
      {
        $match: {
          "delivery.status": "livre"
        }
      },
      {
        $group: {
          _id: "$boutique",
          revenue: { $sum: "$total" },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "boutiques",
          localField: "_id",
          foreignField: "_id",
          as: "boutique"
        }
      },
      { $unwind: { path: "$boutique", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          boutiqueId: "$_id",
          revenue: 1,
          salesCount: 1,
          name: "$boutique.name",
          category: "$boutique.category"
        }
      }
    ]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMineBox = async (req, res) => {
  try {
    const boutique = await Boutique.findOne({ _id: req.params.id, owner: req.user._id });
    if (!boutique) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }

    const box = await Box.findOne({ boutique: boutique._id }).sort({ createdAt: -1 });
    res.json(box || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMineById = async (req, res) => {
  try {
    const { name, category } = req.body;

    const updateData = {};
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (typeof category !== "undefined") updateData.category = category;

    const boutique = await Boutique.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updateData,
      { returnDocument: "after", runValidators: true }
    );

    if (!boutique) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }

    res.json(boutique);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
