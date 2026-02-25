const Delivery = require('../models/Delivery');
const Purchase = require('../models/Purchase');

function getErrorMessage(err) {
  return err?.message || 'Erreur serveur';
}

exports.createMineForPurchases = async (req, res) => {
  try {
    const clientId = req.user?._id;
    const { purchaseIds, mobile, lat, lng } = req.body;

    if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
      return res.status(400).json({ message: 'Achat(s) manquant(s)' });
    }

    if (typeof mobile !== 'string' || !mobile.trim()) {
      return res.status(400).json({ message: 'Numéro mobile requis' });
    }

    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!Number.isFinite(nLat) || nLat < -90 || nLat > 90 || !Number.isFinite(nLng) || nLng < -180 || nLng > 180) {
      return res.status(400).json({ message: 'Position invalide' });
    }

    const ids = [...new Set(purchaseIds.map((x) => String(x)))];
    const purchases = await Purchase.find({ _id: { $in: ids }, client: clientId }).select('_id boutique');
    if (purchases.length !== ids.length) {
      return res.status(404).json({ message: 'Achat non trouvé' });
    }

    const docs = purchases.map((p) => ({
      client: clientId,
      purchase: p._id,
      boutique: p.boutique,
      mobile: mobile.trim(),
      location: { lat: nLat, lng: nLng }
    }));

    const created = await Delivery.insertMany(docs, { ordered: true });
    res.status(201).json({ deliveries: created });
  } catch (err) {
    // duplicate key (purchase unique)
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Livraison déjà enregistrée pour cet achat' });
    }
    res.status(500).json({ message: getErrorMessage(err) });
  }
};
