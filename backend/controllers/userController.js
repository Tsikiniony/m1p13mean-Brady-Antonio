const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Vérifier si email existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer utilisateur
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "client",
      isApproved: true
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, password, isApproved } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;
    if (typeof isApproved !== 'undefined') updateData.isApproved = isApproved;

    if (role === "boutique" && typeof isApproved === 'undefined') {
      updateData.isApproved = true;
    }
    
    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET boutiques en attente (admin)
exports.getPendingBoutiques = async (req, res) => {
  try {
    const boutiques = await User.find({ role: "boutique", isApproved: false })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET boutiques approuvées (admin)
exports.getApprovedBoutiques = async (req, res) => {
  try {
    const boutiques = await User.find({ role: "boutique", isApproved: true })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// APPROVE boutique (admin)
exports.approveBoutique = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    if (user.role !== "boutique") {
      return res.status(400).json({ message: "Cet utilisateur n'est pas une boutique" });
    }

    user.isApproved = true;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
