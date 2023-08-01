var express = require('express');
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

//SIGN UP - INSCRIPTION DE L'UTILISATEUR
router.post('/signup', (req, res) => {
  // Vérifie que les champs ne sont pas vides
  if (!checkBody(req.body, ['prenom', 'nom','email', 'motDePasse', 'tel'])) {
    res.json({ result: false, error: 'champs manquants ou vides' });
    return;
  }
  User.findOne({ email: req.body.email }).then(data => {
    // Vérifie si l'utilisateur n'est pas déjà enregistré dans la BDD
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.motDePasse, 10);

      const {prenom, nom, email, tel}=req.body

      const newUser = new User({
        prenom, nom, email, tel,
        motDePasse: hash,
        token: uid2(32),
        })
      newUser.save().then(newDoc => {
        res.json({ result: true, data: newDoc });
      });
    } else {
      // Utilisateur déjà existant dans la BDD
      res.json({ result: false, error: 'Utilisateur déjà existant' });
    }
  });
});


//SIGN IN - CONNEXION DE L'UTILISATEUR
router.post('/signin', (req, res) => {
  // Vérifie que les champs ne sont pas vides
  if (!checkBody(req.body, ['email', 'motDePasse'])) {
    res.json({ result: false, error: 'champs manquants ou vides' });
    return;
  }
  User.findOne({ email: req.body.email }).then(data => {
    // Vérifie si l'utilisateur est bien présent dans la BDD
    if (data && bcrypt.compareSync(req.body.motDePasse, data.motDePasse)) {
      res.json({ result: true, data: data });
    } else {
      res.json({ result: false, error: 'Utilisateur non trouvé ou mauvais mot de passe' });
    }
  });
});


//RECUPERATION D'UN UTILSATEUR DE LA BDD
router.get('/', (req, res) => {
  const {email}=req.body;

	User.findOne({email}).then(data => {
    if (data) {
      res.json({ user: data });
    } else {
      res.json({erreur : "Utilisateur non existant"})
    }
		
	});
});

//MISE A JOUR D'UN CHAMP DE LA COLLECTION USERS
router.put('/:email', (req, res) => {  
  const {prenom, nom, email, tel, 
    zoneLoc, budgetMois, typeBienLoc, minSurfaceLoc, minPieceLoc, nbLoc, meuble, 
    zoneAchat, budgetMax, typeBienAchat, minSurfaceAchat, minPieceAchat, typeInvest, 
    salaire, primo, financement, accordBanque, banqueDoc,
    idDoc, domDoc, contrat, salaire1, salaire2, salaire3, impots, bilan, autres}=req.body;

    User.findOne({email:req.params.email}).then(data => { 
      if (data) {

      data.prenom=prenom;
      data.nom=nom;
      data.email=email;
      data.tel=tel;
      
      data.location.zoneLoc=zoneLoc;
      data.location.budgetMois=budgetMois;
      data.location.typeBienLoc=typeBienLoc;
      data.location.minSurfaceLoc=minSurfaceLoc;
      data.location.minPieceLoc=minPieceLoc;
      data.location.nbLoc=nbLoc;
      data.location.meuble=meuble;

      data.achat.zoneAchat = zoneAchat;
      data.achat.budgetMax = budgetMax;
      data.achat.typeBienAchat=typeBienAchat;
      data.achat.minSurfaceAchat=minSurfaceAchat;
      data.achat.minPieceAchat=minPieceAchat;
      data.achat.typeInvest=typeInvest;

      data.salaire=salaire;
      data.primo=primo;
      data.financement=financement;
      data.accordBanque=accordBanque;
      data.banqueDoc=banqueDoc;

      data.documents.idDoc=idDoc;
      data.documents.domDoc=domDoc;
      data.documents.contrat=contrat;
      data.documents.salaire1=salaire1;
      data.documents.salaire2=salaire2;
      data.documents.salaire3=salaire3;
      data.documents.impots=impots;
      data.documents.bilan=bilan;
      data.documents.autres=autres;
      
      res.json({"user après modif": data })
      data.save();
      } else {
        res.json({erreur : "Utilisateur non trouvé" })
      }
    })
})


//SUPPRESSION DE COMPTE
router.delete('/:email', (req, res) => {
    User.deleteOne({email: req.params.email})
    .then(() => {
      res.json({message : "compte supprimé" });
    })
 });
 


module.exports = router;
