const sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');

const putDeactivateWagesReports  = async (req, res) => {
    try {
        const decodedToken = req.headerSession;
        const tokenCompanyId = decodedToken.companyId;
        const db = sequelize(tokenCompanyId);

        let data = { ...req.body, ...req.query }

     let {reportId} = data

        if (!reportId) {
            return res.status(400).send({ status: false, msg: 'Missing report ID' });
        }

        const updateQuery = `
            UPDATE eve_blue_all_report_download_log
            SET status = 'D'
            WHERE id = :reportId
        `;

        const result = await db.query(updateQuery, {
            replacements: { reportId },
            type: QueryTypes.UPDATE
        });

        if (result[1] === 0) {
            return res.status(404).send({ status: false, msg: 'Report not found or already deleted' });
        }
        


        //  return res.status(200).json({
        //             status: true,
        //              result: "success",
        //             alert : 'Excel file generated successfully',
        //             filePath: `${customPathToDisplay}`, // Return path if needed on front-end
        //         });

        res.status(200).send({
            status: true,
            result: "success",
             alert : 'Excel file deleted successfully',
            msg: `Report with ID ${reportId} marked as deleted.`,
        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message });
    }
};

module.exports = {
    putDeactivateWagesReports 
};
