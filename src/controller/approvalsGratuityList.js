let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const currentDate = new Date();
const currentYear = currentDate.getFullYear();

const departmentNameByDepartmentId = async (id, db) => {
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
const getEmployeeNameById = async (id, db) => {
    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (employeeName[0]) {

        let res = Object.values(employeeName[0])
        let newRes = (res.toString());
        return newRes
    }
}


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
    }
    )

    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
    }
}

const getSubCompanyNameById = async (id, db) => {
    let subCompanyName = await db.query('select companyName from eve_acc_subCompany where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subCompanyName[0]) {
        let res = Object.values(subCompanyName[0])
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

const getApprovalsGratuityList = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const userId = decodedToken.userId
        const companyId = decodedToken.companyId
        const branchId = decodedToken.branchId
        const mainUserId = decodedToken.mainUserId
        let data = req.body
        // let { pageNo, limit } = data
        let db = sequelize(companyId)

        let getData = await db.query
            ('select distinct  empMaster.id as empId, empMaster.employeeName as empName ,empMaster.employeeCode as empCode,empMaster.employeeBranchId as branchName ,empMaster.employeeBranchId as branchId,empMaster.employeeSubCompanyId as subCompanyName,empMaster.employeeSubCompanyId as subCompanyId,empMaster.employeeDepartmentId as departmentName,empMaster.employeeDepartmentId as deptId,empMaster.employeeDesignationId as designName,empMaster.employeeDesignationId as designId,empMaster.employeeSubDepartmentId as subDepartmentName, empMaster.employeeSubDepartmentId as subDepartmentId,empMaster.locationID as locationId,eve_acc_locationmaster.location as locationName,grtSttg.amount,empMaster.employeeType,empMaster.employeeDoj,grtSttg.approveStatus,resign.resignationDate,empMaster.gratuityAct          from eve_acc_employee as empMaster left join eve_gratuity_list_setting as grtSttg on empMaster.id=grtSttg.empId left join eve_employee_resignation_list as resign on empMaster.id=resign.empId LEFT JOIN eve_acc_locationmaster on empMaster.locationID=eve_acc_locationmaster.id  ', {
                replacements: { // limit: +limit || getData.length, offset: (limit * ((pageNo || 1) - 1)), 
                }, type: QueryTypes.SELECT

            })

        let eve_employee_resignation_list = await db.query('select * from eve_employee_resignation_list where resignStatus="A"', {
            type: QueryTypes.SELECT
        })


        await Promise.all(getData.map(async (e, i) => {
            e.branchName = e.branchName != null ? await getBranchNameByBranchId(e.branchName, db) : ''
            e.branchName = !e.branchName ? '' : e.branchName
            if (e.subCompanyName != null && e.subCompanyName != '') {
                e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)
            }
            if (e.subCompanyName == null) {
                e.subCompanyName = ''
            }

            if (e.subCompanyId == null) {
                e.subCompanyId = ''
            }

            if (e.designName != null && e.designName != '') {
                e.designName = await getDesignationNameById(e.designName, db)
            }

            if (e.designName == null) {
                e.designName = ''
            }
            if (e.departmentName != null && e.departmentName != '') {
                e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)
            }
            if (e.departmentName == null) {
                e.departmentName = ''
            }
            if (e.subDepartmentName != null && e.subDepartmentName != '') {
                e.subDepartmentName = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentName, db)
            }
            if (e.subDepartmentName == null) {
                e.subDepartmentName = ''
            }
            if (e.subCompanyId != null) {

                e.subCompanyId = e.subCompanyId.toString()
            }
            if (e.employeeType == null) {
                e.employeeType = 'White Collar'
            }
            if (e.employeeType == '') {
                e.employeeType = 'White Collar'
            }
            if (e.locationName == null) {
                e.locationName = ''
            }
            if (e.location == null) {
                e.location = ''
            }
            if (e.empCode == null) {
                e.empCode = ''
            }
            if (e.subDepartmentId == null) {
                e.subDepartmentId = ''
            }
            e.approveStatus = e.approveStatus === null ? e.approveStatus = '' : e.approveStatus

            e.slno = Number(i + 1)


            if (e.approveStatus == 'A') {
                e.status = 'Approval In Progress'
                e.statusColor = 'green'
            }
            else if (e.approveStatus == 'C') {
                e.status = 'Rejected'
                e.statusColor = 'red'
            }
            else {
                e.status = ''
                e.statusColor = ''
            }
            if (e.approveStatus == 'A') {
                e.status = 'Completed'
                e.statusColor = 'green'
            }
            if (e.approveStatus == 'C') {
                e.status = 'Rejected'
                e.statusColor = 'red'
            }


            let dateOfJoinStr = e.employeeDoj
            let joinYear
            if (dateOfJoinStr != null) {
                let date = moment(dateOfJoinStr, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let day = date.format('DD', 'MM-DD-YYYY').toString()
                let years = date.format('YYYY', "MM-DD-YYYY").toString()
                let months = date.format('MM', "MM-DD-YYYY").toString();

                joinYear = years
                e.joinYear = joinYear
            }
            
            let dateString = e.resignationDate
            let resignYear
            if (dateString != null) {
                let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let day = date.format('DD', 'MM-DD-YYYY').toString()
                let years = date.format('YYYY', "MM-DD-YYYY").toString()
                let months = date.format('MM', "MM-DD-YYYY").toString();
                // console.log(day);
                if (months >= '06' && day >= '01') {
                    resignYear = (parseInt(years) + 1).toString()
                }
                else {
                    resignYear = years
                }
                e.resignYear = resignYear
            }
            if (e.resignYear) {
                e.diffYear = parseInt(parseInt(e.resignYear) - parseInt(e.joinYear))
            
            }
            if (!e.diffYear) {
                   e.diffYear=(currentYear)-parseInt(e.joinYear)
            }
            if (e.diffYear >= 5) {
                e.eligibility = 'Eligible'
            }
            else {
                e.eligibility = ''
            }


        }))
        
        getData.sort((a, b) => a.empName.localeCompare(b.empName));
        let limit = parseInt(req.body.limit) || getData.length
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = getData.slice(startIndex, endIndex);
        res.send({
            // msg:getData,
            msg: paginatedData,
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getApprovalsGratuityList }