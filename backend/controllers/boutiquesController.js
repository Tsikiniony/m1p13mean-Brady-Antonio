const Boutique = require("../models/Boutique");
const Box = require("../models/Box");

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
