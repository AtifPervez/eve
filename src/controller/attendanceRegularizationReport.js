let sequelize = require(("../config/db"))
const { QueryTypes } = require(('sequelize'))


const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {
        replacements: {
            branchId: id,
        },
        type: QueryTypes.SELECT
    })
    if (branchName[0]) {

        let res = Object.values(branchName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getDesignationNameById = async (id, db) => {
    let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getSubDepartmentNameBySubDepartmentId = async (id, db) => {
    let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subDepartment[0]) {
        let res = Object.values(subDepartment[0])
        let newRes = res.toString()
        return newRes
    }
}

const getAttendanceRegularizationReport = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME } = data
        let db = sequelize(DB_NAME)
        let getData = await db.query('select  emp.id as employeeId,emp.employeeName as name,emp.employeeSubcompanyName as subcompany,emp.employeeDepartment as Department,emp.employeeDesignationId as Designation,emp.employeeBranchId as Branch,emp.employeeCode,emp.employeeSubDepartmentId as SubDepartment,self.mm,self.yyyy,self.used as creditUsed,self.remaining as creditremain,self.creadit_month as creditDay from eve_acc_employee as emp left join eve_self_registration as self on emp.id=self.empId where emp.status="A" && self.status="A"',
            {
                replacements: {}, type: QueryTypes.SELECT
            }
        )
        for (i in getData) {
            let e = getData[i]
            e.slNo = Number(+i + 1)
            if (e.employeeId != null) {
                e.employeeId = e.employeeId.toString()
            }

            e.Designation = await getDesignationNameById(e.Designation, db)
            if (e.Designation === undefined) {
                e.Designation = null
            }
            e.Branch = await getBranchNameByBranchId(e.Branch, db)
            if (e.Branch === undefined) {
                e.Branch = null
            }
            if (e.SubDepartment != null && e.SubDepartment != '') {
                e.SubDepartment = await getSubDepartmentNameBySubDepartmentId(e.SubDepartment, db)
            }
            if (e.mm == '01') {
                e.mm = `Jan-${e.yyyy}`
            }
            else if (e.mm == '02') {
                e.mm = `Feb-${e.yyyy}`
            }
            else if (e.mm == '03') {
                e.mm = `March-${e.yyyy}`
            }
            else if (e.mm == '04') {
                e.mm = `April-${e.yyyy}`
            }
            else if (e.mm == '05') {
                e.mm = `May-${e.yyyy}`
            }
            else if (e.mm == '06') {
                e.mm = `June-${e.yyyy}`
            }
            else if (e.mm == '07') {
                e.mm = `July-${e.yyyy}`
            }
            else if (e.mm == '08') {
                e.mm = `Aug-${e.yyyy}`
            }
            else if (e.mm == '09') {
                e.mm = `Sep-${e.yyyy}`
            }
            else if (e.mm == '10') {
                e.mm = `Oct-${e.yyyy}`
            }
            else if (e.mm == '11') {
                e.mm = `Nov-${e.yyyy}`
            }
            else if (e.mm == '12') {
                e.mm = `Dec-${e.yyyy}`
            }
        }
        getData.map((x) => {
            delete x.yyyy
        })
         getData.sort((a, b) => a.name.localeCompare(b.name));
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = getData.slice(startIndex, endIndex);

        res.status(200).send({ status: true, currentPage: pageNo, recordedPerPage: limit, totalData: getData.length, getlistArray: paginatedData })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message })
    }
}
module.exports = { getAttendanceRegularizationReport }