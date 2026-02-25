const Purchase = require('../models/Purchase');
const Boutique = require('../models/Boutique');

function getErrorMessage(err) {
  return err?.message || 'Erreur serveur';
}

async function assertMineBoutiqueOr404({ boutiqueId, ownerId }) {
  const boutique = await Boutique.findOne({ _id: boutiqueId, owner: ownerId }).select('_id name category');
  if (!boutique) {
    const err = new Error('Boutique non trouvée');
    err.statusCode = 404;
    throw err;
  }
  return boutique;
}

exports.listSalesMineForBoutique = async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    await assertMineBoutiqueOr404({ boutiqueId, ownerId: req.user._id });

    const sales = await Purchase.find({ boutique: boutiqueId })
      .sort({ createdAt: -1 })
      .populate('client', 'name email')
      .populate('boutique', 'name category');

    res.json(sales);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: getErrorMessage(err) });
  }
};

exports.listSalesMine = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const boutiques = await Boutique.find({ owner: ownerId }).select('_id');
    const ids = (boutiques || []).map((b) => b._id);

    if (ids.length === 0) {
      return res.json([]);
    }

    const sales = await Purchase.find({ boutique: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate('client', 'name email')
      .populate('boutique', 'name category');

    res.json(sales);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: getErrorMessage(err) });
  }
};
