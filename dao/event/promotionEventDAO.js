const sql = require('mssql');
const config = require('../../config/dbconfig');

class promotionEventDAO {
    async getPromotionEvents() {
        try {
            const pool = await sql.connect(config);
            const event = await pool.request()
                .query('SELECT * FROM PromotionsEvents');
            return event.recordset;

        } catch (err) {
            console.log(err);
            return { message: 'Event not Available' };
        }
    }
    async getPromotionEventsByType(eventType) {
        try {
            const pool = await sql.connect(config);
            const event = await pool.request()
                .input('EventType', sql.NVarChar, eventType)
                .query('SELECT * FROM PromotionsEvents WHERE EventType = @EventType');
            return event.recordset;

        } catch (err) {
            console.log(err);
            return { message: 'Event not Available' };
        }
    }

    async createPromotionEvent(event) {       
        try {
            if (!event.EventName || !event.EventDescription  || !event.EventDate || !event.EventLocation || !event.EventType) {
                return ({ message: 'Please Input Event Field' });
            }
            const pool = await sql.connect(config);
            const insertEvent = await pool.request()
                .input('EventName', sql.VarChar, event.EventName)
                .input('EventDescription', sql.NVarChar, event.EventDescription)
                .input('EventDate', sql.Date, event.EventDate)
                .input('EventLocation', sql.VarChar, event.EventLocation)
                .input('EventType', sql.VarChar, event.EventType)
                .query("INSERT INTO PromotionsEvents (EventName, EventDescription, EventDate, EventLocation, EventType) VALUES (@EventName, @EventDescription, @EventDate, @EventLocation, @EventType )");
                if (insertEvent.rowsAffected[0] > 0) {
                    return { status: true, message: 'The event has been created successfully' };
                } else {
                    return { status: false, message: 'The event cannot be created' };
                }
        
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    async updatePromotionEvent(id, event) {       
        try {
            if (!event.EventName || !event.EventDescription  || !event.EventDate || !event.EventLocation || !event.EventType) {
                return ({ message: 'Please Input Event Field' });
            }
            const pool = await sql.connect(config);
            const updateEvent = await pool.request()
                .input('EventID', sql.Int, id)
                .input('EventName', sql.VarChar, event.EventName)
                .input('EventDescription', sql.NVarChar, event.EventDescription)
                .input('EventDate', sql.Date, event.EventDate)
                .input('EventLocation', sql.VarChar, event.EventLocation)
                .input('EventType', sql.VarChar, event.EventType)
                .query("UPDATE PromotionsEvents SET EventName = @EventName, EventDescription = @EventDescription, EventDate = @EventDate, EventLocation = @EventLocation, EventType = @EventType WHERE EventID = @EventID ");
                if (updateEvent.rowsAffected[0] > 0) {
                    return { status: true, message: 'The event has been updated successfully' };
                } else {
                    return { status: false, message: 'The event cannot be updated' };
                }
        
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }

}

module.exports = new promotionEventDAO();