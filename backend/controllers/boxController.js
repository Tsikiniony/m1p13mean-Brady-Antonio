const Box = require("../models/Box");
const Boutique = require("../models/Boutique");

const withStatus = (box) => {
  const obj = box.toObject ? box.toObject() : box;
  const now = new Date();
  
  // Si la box n'a pas de boutique, elle est "non prise"
  if (!obj.boutique) {
    return { ...obj, status: "non prise" };
  }
  
  // Si la box a une date d'expiration expirée, elle devient "non prise"
  if (obj.rentExpiresAt && new Date(obj.rentExpiresAt) <= now) {
    return { ...obj, status: "non prise" };
  }
  
  // Sinon elle est "prise"
  return { ...obj, status: "prise" };
};

exports.getRequestsHistory = async (req, res) => {
  try {
    const boxes = await Box.find({ "requests.status": { $in: ["approved", "rejected"] } })
      .populate({
        path: "requests.boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      })
      .sort({ createdAt: -1 });

    const history = [];
    for (const box of boxes) {
      for (const r of box.requests || []) {
        if (r.status === "approved" || r.status === "rejected") {
          history.push({
            boxId: box._id,
            boxName: box.name,
            boxNumber: box.number,
            requestId: r._id,
            boutique: r.boutique,
            status: r.status,
            createdAt: r.createdAt,
            decidedAt: r.decidedAt || null
          });
        }
      }
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyRequestsHistory = async (req, res) => {
  try {
    const myBoutiques = await Boutique.find({ owner: req.user._id }).select("_id");
    const myBoutiqueIds = (myBoutiques || []).map((b) => b._id);

    const boxes = await Box.find({ "requests.status": { $in: ["approved", "rejected"] } })
      .populate({
        path: "requests.boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      })
      .sort({ createdAt: -1 });

    const history = [];
    for (const box of boxes) {
      for (const r of box.requests || []) {
        if (
          (r.status === "approved" || r.status === "rejected") &&
          myBoutiqueIds.some((id) => String(id) === String(r.boutique._id))
        ) {
          history.push({
            boxId: box._id,
            boxName: box.name,
            boxNumber: box.number,
            requestId: r._id,
            boutique: r.boutique,
            status: r.status,
            createdAt: r.createdAt,
            decidedAt: r.decidedAt || null
          });
        }
      }
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requestBox = async (req, res) => {
  try {
    const boxId = req.params.id;
    const { boutiqueId } = req.body;

    if (!boutiqueId) {
      return res.status(400).json({ message: "boutiqueId est requis" });
    }

    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) {
      return res.status(404).json({ message: "Boutique non trouvée" });
    }
    if (String(boutique.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: "Accès interdit à cette boutique" });
    }

    // Règle: 1 boutique = 1 box
    const alreadyHasBox = await Box.exists({ boutique: boutiqueId });
    if (alreadyHasBox) {
      return res.status(400).json({ message: "Cette boutique a déjà une box" });
    }

    const box = await Box.findById(boxId);
    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }

    if (box.boutique) {
      return res.status(400).json({ message: "Cette box est déjà prise" });
    }

    const existingPending = (box.requests || []).find(
      (r) => String(r.boutique) === String(boutiqueId) && r.status === "pending"
    );
    if (existingPending) {
      return res.status(400).json({ message: "Demande déjà envoyée" });
    }

    box.requests.push({ boutique: boutiqueId, status: "pending" });
    await box.save();

    res.status(201).json({ message: "Demande envoyée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const boxes = await Box.find({ "requests.status": "pending" })
      .populate({
        path: "requests.boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      })
      .sort({ createdAt: -1 });

    const pending = [];
    for (const box of boxes) {
      for (const r of box.requests || []) {
        if (r.status === "pending") {
          pending.push({
            boxId: box._id,
            boxName: box.name,
            boxNumber: box.number,
            requestId: r._id,
            boutique: r.boutique,
            createdAt: r.createdAt
          });
        }
      }
    }

    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }

    const request = (box.requests || []).id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Demande non trouvée" });
    }

    if (box.boutique) {
      return res.status(400).json({ message: "Cette box est déjà prise" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Demande déjà traitée" });
    }

    // Règle: 1 boutique = 1 box
    const boutiqueAlreadyAssigned = await Box.exists({ boutique: request.boutique });
    if (boutiqueAlreadyAssigned) {
      return res.status(400).json({ message: "Cette boutique a déjà une box" });
    }

    box.boutique = request.boutique;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    box.rentExpiresAt = expiresAt;
    request.status = "approved";
    request.decidedAt = new Date();

    for (const r of box.requests || []) {
      if (String(r._id) !== String(request._id) && r.status === "pending") {
        r.status = "rejected";
        r.decidedAt = new Date();
      }
    }

    await box.save();

    const populated = await Box.findById(box._id)
      .populate({
        path: "boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      })
      .populate({
        path: "requests.boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      });

    res.json(withStatus(populated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyRents = async (req, res) => {
  try {
    const myBoutiques = await Boutique.find({ owner: req.user._id }).select("_id name category");
    const myBoutiqueIds = (myBoutiques || []).map((b) => b._id);

    const boxes = await Box.find({ boutique: { $in: myBoutiqueIds } })
      .populate({ path: "boutique", select: "name category owner" })
      .sort({ createdAt: -1 });

    res.json((boxes || []).map(withStatus));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }

    const request = (box.requests || []).id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Demande non trouvée" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Demande déjà traitée" });
    }

    request.status = "rejected";
    request.decidedAt = new Date();
    await box.save();

    const populated = await Box.findById(box._id)
      .populate({
        path: "boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      })
      .populate({
        path: "requests.boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      });

    res.json(withStatus(populated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPublicBoxes = async (req, res) => {
  try {
    const boxes = await Box.find().sort({ createdAt: -1 });
    res.json(boxes.map(withStatus));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPublicBoxById = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id).populate({
      path: "boutique",
      select: "name category owner",
      populate: { path: "owner", select: "name email" }
    });
    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }
    res.json(withStatus(box));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBoxesForBoutiqueRequest = async (req, res) => {
  try {
    const myBoutiques = await Boutique.find({ owner: req.user._id }).select("_id");
    const myBoutiqueIds = (myBoutiques || []).map((b) => b._id);

    const boxes = await Box.find().sort({ createdAt: -1 });

    const sanitized = (boxes || []).map((box) => {
      const obj = withStatus(box);
      const requests = Array.isArray(obj.requests) ? obj.requests : [];
      return {
        ...obj,
        requests: requests
          .filter((r) => myBoutiqueIds.some((id) => String(id) === String(r.boutique)))
          .map((r) => ({
            _id: r._id,
            boutique: r.boutique,
            status: r.status,
            createdAt: r.createdAt
          }))
      };
    });

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBoxes = async (req, res) => {
  try {
    const boxes = await Box.find().sort({ createdAt: -1 });
    res.json(boxes.map(withStatus));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.extendRent = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }

    if (!box.boutique) {
      return res.status(400).json({ message: "Cette box n'est pas louée" });
    }

    const now = new Date();
    const currentExpiry = box.rentExpiresAt ? new Date(box.rentExpiresAt) : null;
    const baseDate =
      currentExpiry &&
      !Number.isNaN(currentExpiry.getTime()) &&
      currentExpiry.getTime() > now.getTime()
        ? currentExpiry
        : now;

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + 1);
    box.rentExpiresAt = newExpiry;

    await box.save();

    const populated = await Box.findById(box._id)
      .populate({
        path: "boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      })
      .populate({
        path: "requests.boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      });

    res.json(withStatus(populated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBoxById = async (req, res) => {
  try {
    console.log("[GET /api/boxes/:id]", req.params.id, "user=", req.user?._id);
    const box = await Box.findById(req.params.id)
      .populate({
        path: "boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      })
      .populate({
        path: "requests.boutique",
        select: "name category owner",
        populate: { path: "owner", select: "name email" }
      });
    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }
    console.log("[GET /api/boxes/:id] found", box._id);
    res.json(withStatus(box));
  } catch (error) {
    console.error("[GET /api/boxes/:id] error", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createBox = async (req, res) => {
  try {
    const { rent, description, image } = req.body;

    if (typeof rent === "undefined") {
      return res.status(400).json({ message: "Le loyer est requis" });
    }

    const rentNumber = Number(rent);
    if (Number.isNaN(rentNumber)) {
      return res.status(400).json({ message: "Le loyer est invalide" });
    }

    let imageUrl = typeof image === "string" ? image : "";
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const createPayload = {
      rent: rentNumber,
      description: typeof description === "string" ? description : "",
      image: imageUrl
    };

    // En cas de collision (E11000) sur number auto-incrémenté, on retente
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const box = await Box.create(createPayload);
        return res.status(201).json(box);
      } catch (err) {
        if (err && err.code === 11000) {
          continue;
        }
        throw err;
      }
    }

    return res.status(500).json({ message: "Erreur serveur", error: "Échec de création (collision numéro)" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message || String(error) });
  }
};

exports.updateBox = async (req, res) => {
  try {
    const { rent, description, image } = req.body;

    const updateData = {};
    if (typeof rent !== "undefined") {
      const rentNumber = Number(rent);
      if (Number.isNaN(rentNumber)) {
        return res.status(400).json({ message: "Le loyer est invalide" });
      }
      updateData.rent = rentNumber;
    }

    if (typeof description !== "undefined") {
      updateData.description = typeof description === "string" ? description : "";
    }

    if (typeof image !== "undefined") {
      updateData.image = typeof image === "string" ? image : "";
    }

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      updateData.image = `${baseUrl}/uploads/${req.file.filename}`;
    }
    const box = await Box.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
      runValidators: true
    });

    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }

    res.json(box);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBox = async (req, res) => {
  try {
    const box = await Box.findByIdAndDelete(req.params.id);
    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }
    res.json({ message: "Box supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
