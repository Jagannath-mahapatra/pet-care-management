const pool = require("../config/db");

const getAppointments = async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.doctor,
        a.reason,
        a.status,
        p.name AS pet_name,
        p.species,
        o.name AS owner_name,
        o.phone AS owner_phone
      FROM appointments a
      INNER JOIN pets p
        ON a.pet_id = p.id
      INNER JOIN owners o
        ON p.owner_id = o.id
      WHERE 1=1
    `;

    const values = [];

    if (search) {
      values.push(`%${search}%`);

      query += `
        AND (
          p.name ILIKE $${values.length}
          OR o.name ILIKE $${values.length}
          OR a.doctor ILIKE $${values.length}
        )
      `;
    }

    if (status) {
      values.push(status);

      query += `
        AND a.status = $${values.length}
      `;
    }

    query += `
      ORDER BY a.appointment_date DESC,
      a.appointment_time DESC
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const result = await pool.query(
      `
      UPDATE appointments
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.json({
      message: "Appointment status updated",
      appointment: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update appointment",
      error: error.message,
    });
  }
};

module.exports = {
  getAppointments,
  updateAppointmentStatus,
};