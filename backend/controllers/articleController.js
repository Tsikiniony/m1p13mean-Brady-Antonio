const Article = require("../models/Article");
const Boutique = require("../models/Boutique");
const Stock = require("../models/Stock");

function getPublicBaseUrl(req) {
  const fromEnv = process.env.PUBLIC_BASE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, "");
  }
  return `${req.protocol}://${req.get("host")}`;
}

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

    const articleIds = articles.map((a) => a._id);
    const stocks = await Stock.find({ boutique: boutiqueId, article: { $in: articleIds } }).select('article quantity');
    const byArticleId = new Map(stocks.map((s) => [String(s.article), s.quantity]));

    const payload = articles.map((a) => ({
      ...a.toObject(),
      stock: byArticleId.get(String(a._id)) ?? 0
    }));

    res.json(payload);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.createMineForBoutique = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    const { name, price, description, stock } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Le nom est requis" });
    }

    const nPrice = Number(price);
    if (!Number.isFinite(nPrice) || nPrice < 0) {
      return res.status(400).json({ message: "Prix invalide" });
    }

    let imageUrl = null;
    if (req.file) {
      const baseUrl = getPublicBaseUrl(req);
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const article = await Article.create({
      boutique: boutiqueId,
      name: name.trim(),
      price: nPrice,
      description: typeof description === "string" ? description : "",
      image: imageUrl
    });

    const nStock = Number(stock);
    if (Number.isFinite(nStock) && nStock >= 0) {
      await Stock.findOneAndUpdate(
        { boutique: boutiqueId, article: article._id },
        { $set: { quantity: Math.floor(nStock) } },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ ...article.toObject(), stock: Number.isFinite(nStock) && nStock >= 0 ? Math.floor(nStock) : 0 });
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
      const baseUrl = getPublicBaseUrl(req);
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
