let sequelize = require(("../config/db"))
const { QueryTypes } = require(('sequelize'))

const getEmployeeNameById = async (id, db) => {
    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    let res = Object.values(employeeName[0])
    let newRes = (res.toString());
    return newRes
}
const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {
        replacements: {
            branchId: id,
        },
        type: QueryTypes.SELECT
    })
    if(branchName[0]){

        let res = Object.values(branchName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getDesignationNameById = async (id, db) => {
    let designationName = await db.query('select name  from eve_acc_designation where id=:id &&status="A"', {
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

const getIncidentReport = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME } = data
        let db = sequelize(DB_NAME)

        //eve_acc_employee as emp


        let getData = await db.query('select distinct emp.employeeName as EmployeeName,emp.employeeSubcompanyName as subcompany,emp.employeeDepartment as Department,inc.Branch,inc.slno,inc.CreatedDatetime,inc.Description,inc.Designation,inc.EmployeeName as empId,inc.incidentDateTime,inc.taggedBy,inc.taggedEmployees,inc.Designation from eve_incident_report as inc left join eve_acc_employee as emp on emp.id=inc.EmployeeName  where inc.status="A" && emp.status="A"',
            {
                replacements: {}, type: QueryTypes.SELECT
            }
        )

        for (let i in getData) {

            let e = getData[i]

            getData[i].id = Number(+i + 1)

            if (getData[i].taggedBy != null) {
                getData[i].taggedBy = await getEmployeeNameById(getData[i].taggedBy, db)
            }



            if (e.Designation != null && e.Designation != '') {
                e.Designation = await getDesignationNameById(e.Designation, db)
            }
            if (e.Designation == undefined) {
                e.Designation = null
            }
         
            e.Branch=await getBranchNameByBranchId(e.Branch,db)

            



            if (e.taggedEmployees != null && e.taggedEmployees != '') {

                let arr = e.taggedEmployees.split(',')

                let newArr = []
                for (let j in arr) {
                    let employeeName = await getEmployeeNameById(arr[j], db)
                    newArr.push(employeeName)
                }
                e.taggedEmployees = newArr.join(',')
            }
        }

        getData.map((e) => {

            delete e.empId

        })
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = getData.slice(startIndex, endIndex);

        return res.status(200).json({
            currentPage:pageNo,
            recordedPerPage: limit,
            totalData: getData.length,
            report: paginatedData
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message })
    }
}
module.exports = { getIncidentReport }
