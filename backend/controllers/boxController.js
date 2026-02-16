const Box = require("../models/Box");

const withStatus = (box) => {
  const obj = box.toObject ? box.toObject() : box;
  return {
    ...obj,
    status: obj.boutique ? "prise" : "non prise"
  };
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
    const box = await Box.findById(req.params.id).populate("boutique", "name email role");
    if (!box) {
      return res.status(404).json({ message: "Box non trouvé" });
    }
    res.json(withStatus(box));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBoxes = async (req, res) => {
  try {
    const boxes = await Box.find()
      .populate("boutique", "name email role")
      .sort({ createdAt: -1 });
    res.json(boxes.map(withStatus));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBoxById = async (req, res) => {
  try {
    console.log("[GET /api/boxes/:id]", req.params.id, "user=", req.user?._id);
    const box = await Box.findById(req.params.id).populate("boutique", "name email role");
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
    const { rent } = req.body;

    if (typeof rent === "undefined") {
      return res.status(400).json({ message: "Le loyer est requis" });
    }

    const rentNumber = Number(rent);
    if (Number.isNaN(rentNumber)) {
      return res.status(400).json({ message: "Le loyer est invalide" });
    }

    const createPayload = {
      rent: rentNumber
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
    const { rent } = req.body;

    const updateData = {};
    if (typeof rent !== "undefined") {
      const rentNumber = Number(rent);
      if (Number.isNaN(rentNumber)) {
        return res.status(400).json({ message: "Le loyer est invalide" });
      }
      updateData.rent = rentNumber;
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
