let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')

const getFinancialYearDropDown = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()
        let data = req.body
        let { year } = data
        const startYear = 2015;
        const currentYear = new Date().getFullYear();
        let yearList = [];

        for (let i = startYear; i <= currentYear; i++) {
            yearList.push({

                year: `${i}-${i + 1}`
            });
        }
        // Reverse so latest year comes first
        const reversedList = yearList.reverse();
        if (year) {
            yearList = yearList.filter((e) => e.year == year)
        }
        res.status(200).send({
            status: true,
            result: "success",
            totalData: yearList.length,
            data: yearList,
        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
const getMonthsDropDown = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()
        let data = req.body
        let { month } = data

        let monthList = [
            { id: '01', month: 'January' },
            { id: '02', month: 'February' },
            { id: '03', month: 'March' },
            { id: '04', month: 'April' },
            { id: '05', month: 'May' },
            { id: '06', month: 'June' },
            { id: '07', month: 'July' },
            { id: '08', month: 'August' },
            { id: '09', month: 'September' },
            { id: '10', month: 'October' },
            { id: '11', month: 'November' },
            { id: '12', month: 'December' }
        ];
        let reordered = monthList.slice(3).concat(monthList.slice(0, 3));

        if (month) {
            reordered = reordered.filter((e) => e.id == month)
        }
        res.status(200).send({
            status: true,
            result: "success",
            totalData: monthList.length,
            data: reordered,
        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
const getSubcomapanyDropDown = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()
        let data = req.body
        let { id } = data

        let subcompanyList = await db.query(`
                      SELECT id, companyName FROM eve_acc_subCompany 
                      WHERE (:id IS NULL OR id =:id) AND status='A'
                      ORDER BY companyName 
                      `,
            {
                replacements: { id: id || null, }, type: QueryTypes.SELECT
            });

        if (id) {
            subcompanyList = subcompanyList.filter((e) => e.id == id)
        }

        res.status(200).send({
            status: true,
            result: "success",
            totalData: subcompanyList.length,
            data: subcompanyList,
        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
const getDepartmentDropDown = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()
        let data = req.body
        let { departmentId, subCompanyId } = data
        

        let departmentList = await db.query(`
                        SELECT id AS departmentId, name,subCompanyId,parentId,branchId FROM eve_acc_department 
                        WHERE (:departmentId IS NULL OR id =:departmentId) 
                        AND status='A'
                        AND parentId IS NULL
                       
                        
                        AND (:subCompanyId IS NULL OR subCompanyId = :subCompanyId)
                      ORDER BY name 
                      `,
            {
                replacements: { 
                    departmentId: departmentId || null, 
                    subCompanyId: subCompanyId || null, 
                }, type: QueryTypes.SELECT
            });

      

        res.status(200).send({
            status: true,
            result: "success",
            totalData: departmentList.length,
            data: departmentList,
        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getFinancialYearDropDown, getMonthsDropDown, getSubcomapanyDropDown,getDepartmentDropDown }