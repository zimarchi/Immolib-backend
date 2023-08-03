var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");

const moment = require("moment");
const { extendMoment } = require("moment-range");
const extendedMoment = extendMoment(moment);

const Disponibilites = require("../models/disponibilites");
const Visite = require("../models/visites");

// Endpoint pour gérer la création de rendez-vous
router.post("/", async (req, res) => {
  const { prosId, usersId, dateOfVisit, startTimeVisit, duration, bienImmoId } =
    req.body;

  //création d'une constante pour le endTimeVisit qui est le StartTime + duration de la visite
  const endTimeVisit = moment(startTimeVisit, "HH:mm")
    .add(duration, "minutes")
    .format("HH:mm");

  //création d'une constante pour le jour de la semaine
  const dayOfWeek = moment(dateOfVisit).locale("fr").format("dddd");
  console.log("dayOfWeek: ", dayOfWeek);
  console.log("dateOfVisit: ", dateOfVisit);
  console.log("prosId: ", prosId);

  // Vérifier si le pro est disponible
 await Disponibilites.findOne({
    pro: prosId,
    dayOfWeek: dayOfWeek,
    startTimeDispo: { $lte: startTimeVisit },
    endTimeDispo: { $gte: endTimeVisit },
    // "Exception.dateOfVisit": dateOfVisit,
    // "Exception.startTimeVisit": { $ne: startTimeVisit },
    // "Exception.endTimeVisit": { $ne: endTimeVisit },
  }).then((data) => {
    if (data) {
      // Vérifier s'il y a une première exception :
      if (data.Exception.length > 0) {
        for (let i = 0; i < data.Exception.length; i++) {
          if (
            data.Exception[i].dateOfVisit === dateOfVisit &&
            data.Exception[i].startTimeVisit === startTimeVisit &&
            data.Exception[i].endTimeVisit === endTimeVisit
          ) {

            // console.log("data.Exception[i].dateOfVisit: ", data.Exception[i].dateOfVisit);
            // console.log("data.Exception[i].startTimeVisit: ", data.Exception[i].startTimeVisit);
            // console.log("data.Exception[i].endTimeVisit: ", data.Exception[i].endTimeVisit);
            return res.json({
              message: "Le pro n'est pas disponible à ce moment-là. mais y'a d'autres visites",
              result: false,
            });
          } else {
            const newVisit = new Visite({
              prosId: prosId,
              usersId: usersId,
              dateOfVisit: dateOfVisit,
              startTimeVisit: startTimeVisit,
              endTimeVisit: endTimeVisit,
              duration: duration,
              statut: "en attente",
              bienImmoId: bienImmoId,
            });
            newVisit.save().then(() => {
              // res.json({
              //   message: "Rendez-vous créé avec succès.",
              //   result: true,
              //   newVisit: newVisit,
              // });
            });
            data.Exception.push({
              dateOfVisit: dateOfVisit,
              startTimeVisit: startTimeVisit,
              endTimeVisit: endTimeVisit,
              duration: duration,
            })
            console.log("data.Exception: ", data.Exception);
          }
        }
      } 
      // S'il n'y a pas d'exception, créer la visite
      else {
        // const newVisit = new Visite({
        //   prosId: prosId,
        //   usersId: usersId,
        //   dateOfVisit: dateOfVisit,
        //   startTimeVisit: startTimeVisit,
        //   endTimeVisit: endTimeVisit,
        //   duration: duration,
        //   statut: "en attente",
        //   bienImmoId: bienImmoId,
        // });
        // newVisit.save().then((newVisit) => {
        //   res.json({
        //     message: "Rendez-vous créé avec succès.",
        //     result: true,
        //     newVisit: newVisit,
        //   });
        // });
        // data.Exception.push({
        //   dateOfVisit: dateOfVisit,
        //   startTimeVisit: startTimeVisit,
        //   endTimeVisit: endTimeVisit,
        //   duration: duration,
        // })

        // console.log("data.Exception: ", data.Exception);
        // S'il y a une exception, vérifier si elle est différente de la nouvelle visite
      }
    } else {
      res.json({
        message: "Le pro n'est pas disponible à ce moment-là.",
        result: false,
      });
    }
  });
});

//création de la route pour récupérer les visites d'un pro
router.get("/pro/:prosId", (req, res) => {
  // Vérifier si l'id du professionnel est valide
  if (!mongoose.Types.ObjectId.isValid(req.params.prosId)) {
    return res.json({ message: "L'id du professionnel n'est pas valide." });
  }

  Visite.find({ prosId: req.params.prosId })
    .populate("usersId")
    .populate("bienImmoId")
    .then((data) => {
      if (data.length > 0) {
        res.json({ VisitesTrouvees: data, result: true });
      } else {
        res.json({
          message: "Pas de visites trouvées pour ce pro",
          result: false,
        });
      }
    });
});

//création d'une route pour récupérer les visites d'un user
router.get("/user/:usersId", (req, res) => {
  // Vérifier si l'id du user est valide
  if (!mongoose.Types.ObjectId.isValid(req.params.usersId)) {
    return res.json({ message: "L'id du user n'est pas valide." });
  }

  Visite.find({ usersId: req.params.usersId })
    .populate("prosId")
    .populate("bienImmoId")
    .then((data) => {
      if (data.length > 0) {
        console.log("data", data);
        res.json({ VisitesTrouvees: data, result: true });
      } else {
        res.json({
          message: "Pas de visites trouvées pour ce user",
          result: false,
        });
      }
    });
});

//route pour update le statut d'une visite
router.put("/:id", (req, res) => {
  // Vérifier si l'id de la visite est valide
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.json({ message: "L'id de la visite n'est pas valide." });
  }

  Visite.findById(req.params.id).then((data) => {
    if (req.body.statut === "confirmé") {
      data.statut = "confirmé";
      data.save();
      res.json({
        message: "La visite est confirmée avec succès.",
        result: true,
      });
    } else if (req.body.statut === "annulé") {
      data.statut = "annulé";
      data.save();

      res.json({
        message: "La visite est annulée avec succès.",
        result: true,
      });
      Disponibilites.findOne({
        "Exception.dateOfVisit": data.dateOfVisit,
        "Exception.startTimeVisit": data.startTimeVisit,
        "Exception.endTimeVisit": data.endTimeVisit,
        pro: req.body.prosId,
      }).then((dispotrouvee) => {
        console.log("data: ", dispotrouvee);

        dispotrouvee.Exception = dispotrouvee.Exception.filter((nimp) => {
          nimp.dateOfVisit !== data.dateOfVisit &&
            nimp.startTimeVisit !== data.startTimeVisit &&
            nimp.endTimeVisit !== data.endTimeVisit;
        });
        dispotrouvee.Exception.save();
      });
    }
  });
});

module.exports = router;
