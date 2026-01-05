let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')
let DB_NAME

function removeDuplicates(objectsArray, key) {
    let uniqueObjects = [];
    let seenKeys = new Set();

    for (const obj of objectsArray) {
        if (!seenKeys.has(obj[key])) {
            uniqueObjects.push(obj);
            seenKeys.add(obj[key]);
        }
    }
    return uniqueObjects;
}


const allListTodayforReport = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME, year, month } = data
      

        //?eve_acc_employee = employee
        //?eve_acc_employee_extra_duty_alocation = empDuty
        //?eve_acc_department = empDep

        let getData = await sequelize(DB_NAME).query('select distinct employee.id as empId,employee.employeeName,employee.employeeCode as code,employee.employeeSubcompanyName as subcompanyName,employee.employeeDepartment as departmentName,employee.employeeDesignation as designationName,employee.employeeBranchId,employee.employeeBranchName as branchName,empDep.name as subDepartmentName  from  eve_acc_employee as employee right join eve_acc_employee_extra_duty_alocation as empDuty on employee.id=empDuty.empId left join eve_acc_department as empDep on employee.employeeSubDepartmentId=empDep.id  ', {
            type: QueryTypes.SELECT
        })

        let extraDutyDb = await sequelize(DB_NAME).query('select * from  eve_acc_employee_extra_duty_alocation where status="A"', {
            type: QueryTypes.SELECT
        })

        let arr = []
        getData.map((e, i) => {
            extraDutyDb.map((x) => {
                let dateString = x.workDate
                let date = moment(dateString)
                let yearBy = date.year()
                let monthBy = +date.month() + 1

                if (yearBy == year && monthBy == month && e.empId == x.empId) {
                    arr.push((getData[i]))
                }
            })
        })


        let extraDutyArr = removeDuplicates(arr, "empId");

        extraDutyArr.map((e,i) => {
            e.totalApprove = 0
            e.totalReject = 0
            e.totalWorkDays = 0
            e.slNo=Number(i) + 1
           
            e.empId = e.empId.toString()

            extraDutyDb.map((x) => {

                if (x.compoffStatus == 'A' && e.empId == x.empId) {
                    e.totalApprove += 1
                    e.totalWorkDays += 1
                }

                else if (x.compoffStatus == 'W' && e.empId == x.empId) {
                    e.totalReject += 1
                    e.totalWorkDays += 1
                }

            })
            return e
        })
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = extraDutyArr.slice(startIndex, endIndex);

        res.status(200).send({
            status: true,
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: extraDutyArr.length, 
            employee: paginatedData
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { allListTodayforReport }