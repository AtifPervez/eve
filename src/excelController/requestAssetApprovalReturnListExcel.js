let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const axios = require('axios')

const ExcelJS = require('exceljs')

const moment = require('moment')



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

    else {

        return ''

    }

}

const getEmployeeNameById = async (id, db) => {

    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id &&status="A"', {

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

    else {

        return ''

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

    else {

        return ''

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

    else {

        return ''

    }

}

const getDesignationIdFromEmpId = async (id, db) => {

    let designationName = await db.query('select employeeDesignationId  from eve_acc_employee where id=:id && status="A"', {

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

    else {

        return ''

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

    else {

        return ''

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

    else {

        return ''

    }

}

function convertDateDDMMYYYY(date) {



    let parsedDate = moment(date)

    let formattedDate = parsedDate.format('DD-MM-YYYY')

    return formattedDate

}



const getAssetCategoryName = async (id, db) => {

    let categoryName = await db.query('select assetName from eve_hrm_employee_set_asset_category where id=:id', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    if (categoryName[0]) {

        let res = Object.values(categoryName[0])

        let newRes = res.toString()

        return newRes

    }

    else {

        return ''

    }

}

const getAssetName = async (id, db) => {

    let assetName = await db.query('select assetName from eve_hrm_employee_set_asset_details where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    if (assetName[0]) {

        let res = Object.values(assetName[0])

        let newRes = res.toString()

        return newRes

    }

    else {

        return ''

    }

}

const getAssetImg = async (id, db) => {

    let img = await db.query('select image from eve_hrm_employee_set_asset_details where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    if (img[0]) {

        let res = Object.values(img[0])

        let newRes = res.toString()

        return newRes

    }

    else {

        return ''

    }

}

function statusColor(status) {

    if (status == 'pending') {

        return 'yellow'

    }

    else if (status == 'approved') {

        return 'green'

    }

    else if (status == 'rejected') {

        return 'red'

    }

    else {

        return ''

    }

}

const taggedResponsiblePerson = async (id, db) => {

    let person = await db.query('select taggedResponsible from eve_hrm_employee_set_asset_category where id=:id', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    if (person[0]) {

        let res = Object.values(person[0])

        let newRes = res.toString()

        return newRes

    }

    else {

        return ''

    }

}

const getEmpCodeFromEmpId = async (id, db) => {

    let empCode = await db.query('select employeeCode from eve_acc_employee where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    if (empCode[0]) {

        let res = Object.values(empCode[0])

        let newRes = res.toString()

        return newRes

    }

    else {

        return ''

    }

}

function formatAmount(numericString) {



    if (numericString != null) {

        let numericValue = numericString

        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return formattedString

    }

}





const getRequestAssetApprovalReturnListExcel = async (req, res) => {

    try {

        const decodedToken = req.headerSession

        const userId = decodedToken.userId

        const companyId = decodedToken.companyId

        const branchId = decodedToken.branchId

        const mainUserId = decodedToken.mainUserId

        let db = sequelize(companyId)

        // let db = sequelize('59')





        let getData = await db.query('select employeeId as empId,employeeId,employeeId as empName,subCompanyId,subCompanyId as subCompanyName,branchId,branchId as branchName,departmentId,departmentId as departmentName,subDepartmentId,subDepartmentId as subDepartmentName,categoryId,returnDate , categoryId as catagoryName ,assetId,assetId as assetName,serialNo,amount,amount as amountEdt,serialNo,returnDate,handoverTo,handoverTo as handoverToName,damaged_on,image as imageUpload,returnStatus as status,handoverDate,quantity,type from eve_hrm_employee_asset_return_details where status="A"', {

            type: QueryTypes.SELECT

        })



        let totalAmount = 0

        await Promise.all(getData.map(async (e) => {



            e.handoverDate = convertDateDDMMYYYY(e.handoverDate)

            e.returnDate = convertDateDDMMYYYY(e.returnDate)

            e.damaged_on = e.damaged_on == null ? '' : e.damaged_on

            if (e.damaged_on != '') {



                e.damaged_on = convertDateDDMMYYYY(e.damaged_on)

            }

            e.imageUpload = e.imageUpload == null ? '' : e.imageUpload

            e.empCode = await getEmpCodeFromEmpId(e.employeeId, db)

            e.empName = await getEmployeeNameById(e.empName, db)

            e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)

            e.branchName = await getBranchNameByBranchId(e.branchName, db)

            e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)

            e.subDepartmentName = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentName, db)

            e.designationId = await getDesignationIdFromEmpId(e.employeeId, db)

            e.designationName = await getDesignationNameById(e.designationId, db)

            e.handoverToName = await getEmployeeNameById(e.handoverTo, db)

            e.catagoryName = await getAssetCategoryName(e.catagoryName, db)

            e.assetName = await getAssetName(e.assetName, db)

            e.assetId = await getAssetName(e.assetId, db)

            e.taggedResponsiblePerson = await taggedResponsiblePerson(e.categoryId, db)

            e.taggedResponsiblePerson = await getEmployeeNameById(e.taggedResponsiblePerson, db)



            if (e.type == 'normal') {

                e.damaged_on = ''

            }



            if (e.type == 'damaged') {

                e.assetReturnType = 'Damaged'

            }

            else if (e.type == 'normal') {

                e.assetReturnType = 'Normal'

            }



            if(e.status=='approved'){

                e.statusNew='Approved'

             }

             else if(e.status=='pending'){

                e.statusNew='Pending'

             }

             else if(e.status=='rejected'){

                e.statusNew='Rejected'

             }





        }))



        let searchData = {

            empCode: req.body.empCode || req.query.empCode,

            empId: req.body.empId,

            subCompanyId: req.body.subCompanyId,

            branchId: req.body.branchId,

            locationId: req.body.locationId,

            deptId: req.body.deptId,

            subDepartmentId: req.body.subDepartmentId,

            designId: req.body.designId,

            assetId: req.body.assetId,

            categoryId: req.body.categoryId,

            assetReturnType: req.body.assetReturnType,

            handoverTo: req.body.handoverTo,

            status: req.body.status,



        }



        let searchEmp = getData.filter((e, i) => {

            let boo = true

            for (let key in searchData) {

                if (searchData[key] && searchData[key] != e[key]) {

                    boo = false

                    break

                }

            }

            return boo

        })

        let newData = searchEmp.filter((e, i) => {

            if (e.assetName != '') {

                return true

            }

        })



        newData.map((e) => {

            if (e.amount != '') {

                totalAmount += parseFloat(e.amount)



            }

        })



        newData.sort((a, b) => moment(b.returnDate, 'DD-MM-YYYY').diff(moment(a.returnDate, 'DD-MM-YYYY')));



        let count = getData.length

        let limit = parseInt(req.body.limit) || getData.length

        let maxPage = Math.ceil(count / limit)//kitne page h

        let pageNo = parseInt(req.body.pageNo) || 1

        pageNo = pageNo <= maxPage ? pageNo : maxPage

        let startIndex = (pageNo - 1) * limit;

        let endIndex = startIndex + limit;

        let paginatedData = newData.slice(startIndex, endIndex)



        let allotAssetListExcel = paginatedData.map((e, i) => ({

            'Sl. No.': Number(i + 1),

            'Employee Code': e.empCode,

            'Employee Name': e.empName,

            'Sub Company': e.subCompanyName,

            'Branch': e.branchName,

            'Department': e.departmentName,

            'Sub Department': e.subDepartmentName,

            'Designation': e.designationName,

            'Return Request Date': e.returnDate,

            'Handover Date': e.handoverDate,

            'Handover To': e.handoverToName,

            'Allotment Date': e.addedDate,

            'Allotted By': e.allotedBy,

            'Asset Category': e.catagoryName,

            'Asset Name': e.assetName,

            'Quantity': e.quantity,

            'Serial/Model No.': e.serialNo,

            'Asset Return Type': e.assetReturnType,

            'Damaged On': e.damaged_on,

            'Status': e.statusNew

        }))



        return res.status(200).json({

            // status: true,

            // totalData: paginatedData.length,

            // '': '',

            // 'Total': `${formatAmount(totalAmount)}`,

            employee: allotAssetListExcel

            // employee: paginatedData

        })



    } catch (error) {

        return res.status(500).json({ status: false, msg: error.message })

    }

}





async function fetchData({ token, pageNo, limit, empCode, empId, subCompanyId, branchId, deptId, subDepartmentId, designId, assetId, categoryId, assetReturnType, handoverTo, status }) {



    try {

        const config = {



            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },

            method: 'POST',

            // url: 'http://localhost:3000/employeeMaster/getRequestAssetApprovalReturnListExcel',

            url: `${process.env.BASE_URL}/employeeMaster/getRequestAssetApprovalReturnListExcel`,



            data: { pageNo, limit, empCode, empId, subCompanyId, branchId, deptId, subDepartmentId, designId, assetId, categoryId, assetReturnType, handoverTo, status }



        }

        const response = await axios(config)

        return response.data;

    } catch (error) {

        throw error;

    }

}



async function createExcelFile(data) {

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Sheet1');

    let values = []

    let employee = data.employee

    let header = Object.keys(employee[0])



    values.push(header)

    employee.forEach(e => {

        let value = Object.values(e)



        values.push(value)

    });



    let amountIndex = header.indexOf('Amount(₹)')

    let len = header.length



    for (let i in data) {

        if (i != 'employee') {

            let row = new Array(len + 1).fill('')

            row[amountIndex - 1] = i

            row[amountIndex] = data[i]

            values.push(row)



        }

    }



    worksheet.addRows(values)

    const headerRow = worksheet.getRow(1);





    worksheet.eachRow((row) => {

        row.eachCell((cell) => {

            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

            cell.border = {

                top: { style: 'thin' },

                left: { style: 'thin' },

                bottom: { style: 'thin' },

                right: { style: 'thin' },

            };

            row.height = 40



        });

    });

    headerRow.eachCell(cell => {



        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }

        cell.font = { bold: true };



    });



    for (let i = 1; i <= 1000; i++) {

        const column = worksheet.getColumn(i);

        column.width = 20; // Set the desired width in characters

    }





    //totalAmount Bold 

    // const lastRow = worksheet.lastRow;



    // lastRow.eachCell((cell, colNumber) => {

    //     cell.font = { bold: true };

    // });

    return workbook.xlsx







}



async function getRequestAssetApprovalReturnListExcelSheet(req, res) {

    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]

        let pageNo = req.body.pageNo || req.query.pageNo

        let limit = req.body.limit || req.query.limit

        let empCode = req.body.empCode || req.query.empCode



        let empId = req.body.empId || req.query.empId

        let subCompanyId = req.body.subCompanyId || req.query.subCompanyId

        let branchId = req.body.branchId || req.query.branchId

        let locationId = req.body.locationId || req.query.locationId

        let deptId = req.body.deptId || req.query.deptId

        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId

        let designId = req.body.designId || req.query.designId

        let assetId = req.body.assetId || req.query.assetId

        let categoryId = req.body.categoryId || req.query.categoryId

        let assetReturnType = req.body.assetReturnType || req.query.assetReturnType

        let handoverTo = req.body.handoverTo || req.query.handoverTo

        let status = req.body.status || req.query.status



        let apiData = await fetchData({

            token, pageNo, limit, empCode, empId, subCompanyId, branchId, locationId, deptId, subDepartmentId, designId, assetId, categoryId, assetReturnType, handoverTo, status

        })



        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', `attachment; filename="requestAssetApprovalReturnList.xlsx"`);



        (await getExcel).write(res)



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = {

    getRequestAssetApprovalReturnListExcel,

    getRequestAssetApprovalReturnListExcelSheet

}









