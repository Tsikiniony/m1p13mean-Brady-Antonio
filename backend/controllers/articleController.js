const Article = require("../models/Article");
const Boutique = require("../models/Boutique");

async function assertMineBoutiqueOr404({ boutiqueId, ownerId }) {
  const boutique = await Boutique.findOne({ _id: boutiqueId, owner: ownerId });
  if (!boutique) {
    const err = new Error("Boutique non trouvée");
    err.statusCode = 404;
    throw err;
  }
  return boutique;
}

exports.listMineForBoutique = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    const articles = await Article.find({ boutique: boutiqueId }).sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.createMineForBoutique = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    const { name, price, description } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Le nom est requis" });
    }

    const nPrice = Number(price);
    if (!Number.isFinite(nPrice) || nPrice < 0) {
      return res.status(400).json({ message: "Prix invalide" });
    }

    let imageUrl = null;
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const article = await Article.create({
      boutique: boutiqueId,
      name: name.trim(),
      price: nPrice,
      description: typeof description === "string" ? description : "",
      image: imageUrl
    });

    res.status(201).json(article);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getMineArticleForBoutique = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    const articleId = req.params.articleId;

    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    const article = await Article.findOne({ _id: articleId, boutique: boutiqueId });
    if (!article) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    res.json(article);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.updateMineArticleForBoutique = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    const articleId = req.params.articleId;

    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    const article = await Article.findOne({ _id: articleId, boutique: boutiqueId });
    if (!article) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    const { name, price, description } = req.body;

    if (typeof name !== "undefined") {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Le nom est requis" });
      }
      article.name = name.trim();
    }

    if (typeof price !== "undefined") {
      const nPrice = Number(price);
      if (!Number.isFinite(nPrice) || nPrice < 0) {
        return res.status(400).json({ message: "Prix invalide" });
      }
      article.price = nPrice;
    }

    if (typeof description !== "undefined") {
      article.description = typeof description === "string" ? description : "";
    }

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      article.image = `${baseUrl}/uploads/${req.file.filename}`;
    }

    await article.save();
    res.json(article);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteMineArticleForBoutique = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    const articleId = req.params.articleId;

    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    const deleted = await Article.findOneAndDelete({ _id: articleId, boutique: boutiqueId });
    if (!deleted) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    res.json({ message: "Produit supprimé" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
