let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')



const getEmployeeSalaryReport = async (req, res) => {
    try {

        let data = req.body


        let { DB_NAME, pageNo, limit, year } = data
        limit = limit || 100

        //LEFT JOIN eve_acc_department ON eve_acc_employee.employeeSubCompanyId=eve_acc_department.subCompanyId

        let getData = await sequelize(DB_NAME).query('select distinct  eve_acc_employee_attendence.empId, eve_acc_employee.employeeName as name ,eve_acc_employee.employeeCode as empCode,eve_acc_employee.employeeSubcompanyName as subCompanyName,eve_acc_employee.employeeDepartment as departmentName,eve_acc_employee.employeeDesignation as designationName,eve_acc_employee.employeeBranchId as branchId          from eve_acc_employee LEFT JOIN eve_acc_employee_attendence ON eve_acc_employee.id=eve_acc_employee_attendence.empId  LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id=eve_hrm_employee_details.employeeId ', {
            replacements:
            {

                limit: +limit || 1000, offset: (100 * ((pageNo || 1) - 1)),

            },
            type: QueryTypes.SELECT
        })

        getData = getData.map((value, index) => {
            value.slno = Number(index) + 1
            value.createDate = ''
            value.paidDate = ''
            value.totalSalary = ''
            value.year = ''
            value.jan = '--'
            value.feb = '--'
            value.mar = '--'
            value.apr = '--'
            value.may = '--'
            value.jun = '--'
            value.jul = '--'
            value.aug = '--'
            value.sep = '--'
            value.oct = '--'
            value.nov = '--'
            value.dec = '--'


            return value
        })


        return res.status(200).send({
            recordedPerPage: limit || 100, totalData: getData.length, currentPage: pageNo,
            employeeList: getData
        })






    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { getEmployeeSalaryReport }