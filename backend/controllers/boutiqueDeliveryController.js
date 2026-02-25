const Delivery = require('../models/Delivery');
const Boutique = require('../models/Boutique');

function getErrorMessage(err) {
  return err?.message || 'Erreur serveur';
}

exports.listMine = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const boutiques = await Boutique.find({ owner: ownerId }).select('_id');
    const ids = (boutiques || []).map((b) => b._id);

    if (ids.length === 0) {
      return res.json([]);
    }

    const deliveries = await Delivery.find({ boutique: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate('boutique', 'name category')
      .populate('client', 'name email')
      .populate({
        path: 'purchase',
        select: 'items total createdAt',
        populate: [{ path: 'items.article', select: 'name price image' }]
      });

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: getErrorMessage(err) });
  }
};

exports.getMineById = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const id = req.params.id;

    const boutiques = await Boutique.find({ owner: ownerId }).select('_id');
    const ids = (boutiques || []).map((b) => b._id);

    if (ids.length === 0) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }

    const delivery = await Delivery.findOne({ _id: id, boutique: { $in: ids } })
      .populate('boutique', 'name category')
      .populate('client', 'name email')
      .populate({
        path: 'purchase',
        select: 'items total createdAt',
        populate: [{ path: 'items.article', select: 'name price image' }]
      });

    if (!delivery) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ message: getErrorMessage(err) });
  }
};

exports.advanceStatusMine = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const id = req.params.id;

    const boutiques = await Boutique.find({ owner: ownerId }).select('_id');
    const ids = (boutiques || []).map((b) => b._id);
    if (ids.length === 0) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }

    const delivery = await Delivery.findOne({ _id: id, boutique: { $in: ids } }).select('status');
    if (!delivery) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }

    const current = delivery.status || 'en_attente';
    let next = current;
    if (current === 'en_attente') next = 'en_cours';
    else if (current === 'en_cours') next = 'livre';
    else if (current === 'livre') {
      return res.status(400).json({ message: 'Livraison déjà terminée' });
    }

    delivery.status = next;
    await delivery.save();
    res.json({ status: delivery.status });
  } catch (err) {
    res.status(500).json({ message: getErrorMessage(err) });
  }
};
