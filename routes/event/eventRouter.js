const express = require('express');
const router = express.Router();
const promotionEventDAO = require('../../dao/event/promotionEventDAO');

router.get('/promotionEvents', async (req, res) => {
    try {
        const event = await promotionEventDAO.getPromotionEvents();
        res.json(event);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/promotionEvents/:eventType', async (req, res) => {
    try {
        const event = await promotionEventDAO.getPromotionEventsByType(req.params.eventType);
        res.json(event);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/new-event', async (req, res) => {
    try {
        const event = req.body;
        const insertEvent = await promotionEventDAO.createPromotionEvent(event);
        res.status(201).json(insertEvent);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.put('/update-event/:id', async (req, res) => {
    try {
        const event = req.body;
        const updateEvent = await promotionEventDAO.updatePromotionEvent(req.params.id, event);
        res.json(updateEvent);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = router;