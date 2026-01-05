let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const axios = require('axios')

const ExcelJS = require('exceljs')

const moment=require('moment')



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

    let originalDate = new Date(date);

    let formattedDate = originalDate.toLocaleDateString('en-GB')

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





const getAcceptAllotAssetListExcel = async (req, res) => {

    try {

        const decodedToken = req.headerSession

        const userId = decodedToken.userId

        const companyId = decodedToken.companyId

        const branchId = decodedToken.branchId

        const mainUserId = decodedToken.mainUserId

        let db = sequelize(companyId)

        // let db = sequelize('59')

        // console.log(await assetCategoryName(41,db));



        let getData = await db.query('select employeeId,employeeId as empName,employeeId as employeeName,subCompanyId as subComp ,subCompanyId as subCompanyName,branchId,branchId as branchName,departmentId,departmentId as departmentName,subDepartmentId,subDepartmentId as subDepartmentName,addedDate,categoryId, categoryId as catagoryName ,assetId,assetId as assetName,requestDate,serialNo,amount,allotedBy,serialNo,allotAcceptStatus as status ,quantity,createdBy from eve_hrm_employee_asset_allotment_details where status="A" && returnStatus="no" && assetId!="null" ', {

            type: QueryTypes.SELECT

        })

        let totalAmount = 0

        let totalQauntity = 0



        let requestFromDate = req.body.requestFromDate

        let requestToDate = req.body.requestToDate



        let startDate = moment(requestFromDate, 'YYYY-MM-DD')

        let endDate = moment(requestToDate, 'YYYY-MM-DD')



        await Promise.all(getData.map(async (e) => {





          

            let parsedDate=moment(e.requestDate)

            e.requestDate =parsedDate.format('DD-MM-YYYY')

            

            let parsedDate1=moment(e.addedDate)

            e.addedDate=parsedDate1.format('DD-MM-YYYY')



            e.addedDate = e.addedDate == null ? '' : e.addedDate

            e.employeeName = await getEmployeeNameById(e.employeeName, db)

            e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)

            e.branchName = await getBranchNameByBranchId(e.branchName, db)

            e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)

            e.subDepartmentName = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentName, db)

            e.designationId = await getDesignationIdFromEmpId(e.employeeId, db)

            e.designationName = await getDesignationNameById(e.designationId, db)

            // e.allotedBy = await getEmployeeNameById(e.allotedBy, db)

            e.allotedBy = await getEmployeeNameById(e.createdBy,db)

            e.catagoryName = await getAssetCategoryName(e.catagoryName, db)

            e.assetName = await getAssetName(e.assetName, db)

            e.taggedResponsible = await taggedResponsiblePerson(e.categoryId, db)

            e.taggedResponsiblePerson = await taggedResponsiblePerson(e.categoryId, db)

            e.taggedResponsiblePerson = await getEmployeeNameById(e.taggedResponsiblePerson, db)

            e.empCode = await getEmpCodeFromEmpId(e.employeeId, db)



            e.quantity = e.quantity == null ? '' : e.quantity



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

            empName: req.body.empName,

            subComp: req.body.subComp,

            branchId: req.body.branchId,

            departmentId: req.body.departmentId,

            subDepartmentId: req.body.subDepartmentId,

            designationId: req.body.designationId,

            categoryId: req.body.categoryId,

            assetId: req.body.assetId,

            taggedResponsible: req.body.taggedResponsible,

            status:req.body.status

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



            if (e.quantity != '') {

                totalQauntity += parseFloat(e.quantity)

            }

        })

        

        newData.sort((a, b) => moment(b.addedDate, 'DD-MM-YYYY').diff(moment(a.addedDate, 'DD-MM-YYYY')));



        newData.map((e)=>e.amount=formatAmount(parseFloat(e.amount)))



        let count = getData.length

        let limit = parseInt(req.body.limit) || getData.length

        let maxPage = Math.ceil(count / limit)//kitne page h

        let pageNo = parseInt(req.body.pageNo) || 1

        pageNo = pageNo <= maxPage ? pageNo : maxPage

        let startIndex = (pageNo - 1) * limit;

        let endIndex = startIndex + limit;

        let paginatedData = newData.slice(startIndex, endIndex)



        let acceptAllotAssetListExcel = paginatedData.map((e, i) => ({

            'Sl No': Number(i + 1),

            'Employee Code': e.empCode,

            'Employee Name': e.employeeName,

            'Sub Company': e.subCompanyName,

            'Branch': e.branchName,

            'Department': e.departmentName,

            'Sub Department': e.subDepartmentName,

            'Designation': e.designationName,

            'Request Date': e.requestDate,

            'Allotment Date': e.addedDate,

            'Allotted By': e.allotedBy,

            'Asset Category': e.catagoryName,

            'Asset Incharge': e.taggedResponsiblePerson,

            'Asset Name': e.assetName,

            'Quantity': e.quantity,

            'Serial/Model No.': e.serialNo,

            'Amount(₹)': e.amount,

            'Status': e.statusNew

        }))



      

        let filteredEmployees = getData.filter(employee => {

            let doj = moment(employee.requestDate, 'DD-MM-YYYY', true);

            // console.log(doj);

            return (doj.isSameOrAfter(moment(startDate)) && doj.isSameOrBefore(moment(endDate)))

        });

        



        /******************************************************************************/

        if (requestFromDate && requestToDate) {



         let totalAmountFilter=0

         let totalQauntityFl = 0

       

            let searchData = {

                empCode: req.body.empCode || req.query.empCode,

                empName: req.body.empName,

                subComp: req.body.subComp,

                branchId: req.body.branchId,

                departmentId: req.body.departmentId,

                subDepartmentId: req.body.subDepartmentId,

                designationId: req.body.designationId,

                categoryId: req.body.categoryId,

                assetId: req.body.assetId,

                taggedResponsible: req.body.taggedResponsible,

                status:req.body.status

    

            }

    

    

    

            let searchEmp = filteredEmployees.filter((e, i) => {

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

                    totalAmountFilter += parseFloat(e.amount)

                }

                if (e.quantity != '') {

                    totalQauntityFl += parseFloat(e.quantity)

                }

            })

            newData.sort((a, b) => moment(b.addedDate, 'DD-MM-YYYY').diff(moment(a.addedDate, 'DD-MM-YYYY')));



            newData.map((e)=>e.amount=formatAmount(parseFloat(e.amount)))



            let count = filteredEmployees.length

            let limit = parseInt(req.body.limit) || filteredEmployees.length

            let maxPage = Math.ceil(count / limit)//kitne page h

            let pageNo = parseInt(req.body.pageNo) || 1

            pageNo = pageNo <= maxPage ? pageNo : maxPage

            let startIndex = (pageNo - 1) * limit;

            let endIndex = startIndex + limit;

            let paginatedData = newData.slice(startIndex, endIndex)

    

            let acceptAllotAssetListExcel = paginatedData.map((e, i) => ({

            'Sl. No.': Number(i + 1),

            'Employee Code': e.empCode,

            'Employee Name': e.employeeName,

            'Sub Company': e.subCompanyName,

            'Branch': e.branchName,

            'Department': e.departmentName,

            'Sub Department': e.subDepartmentName,

            'Designation': e.designationName,

            'Request Date': e.requestDate,

            'Allotment Date': e.addedDate,

            'Allotted By': e.allotedBy,

            'Asset Category': e.catagoryName,

            'Asset Incharge': e.taggedResponsiblePerson,

            'Asset Name': e.assetName,

            'Quantity': e.quantity,

            'Serial/Model No.': e.serialNo,

            'Amount(₹)': e.amount,

            'status': e.statusNew

            }))

    

          

    // console.log(paginatedData);

            return res.status(200).json({

                '': '',

                'Total Quantity': `Total : ${totalQauntityFl}`,

                'Total Amount': `Total : ${formatAmount(totalAmountFilter)}`,

                employee: acceptAllotAssetListExcel

                // employee: paginatedData

              

            })

          

            }



        return res.status(200).json({



            '': '',

            'Total Quantity': `Total : ${totalQauntity}`,

           'Total Amount': `Total : ${formatAmount(totalAmount)}`,

           employee: acceptAllotAssetListExcel

           // employee: paginatedData

           

        })



    } catch (error) {

        return res.status(500).json({ status: false, msg: error.message })

    }

}





async function fetchData({token, pageNo, limit, empCode, empName, subComp, branchId, locationId, departmentId, subDepartmentId, designationId,categoryId,assetId,taggedResponsible,requestFromDate,requestToDate,status }) {



    try {

        const config = {



            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },

            method: 'POST',

            // url: 'http://localhost:3000/employeeMaster/getAcceptAlottedAssetExcel',

            url:`${process.env.BASE_URL}/employeeMaster/getAcceptAlottedAssetExcel`,



            data: { token, pageNo, limit, empCode, empName, subComp, branchId, locationId, departmentId, subDepartmentId, designationId,categoryId,assetId,taggedResponsible,requestFromDate,requestToDate,status }



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

    let quantityIndex = header.indexOf('Quantity')

    let len = header.length

    let row = new Array(len).fill('')

   

    row[amountIndex]=data['Total Amount']

    row[quantityIndex]=data['Total Quantity']

    values.push(row)

  

   

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

    const lastRow = worksheet.lastRow;



    lastRow.eachCell((cell, colNumber) => {

        cell.font = { bold: true };

    });

    return workbook.xlsx







}



async function getAcceptAllotAssetListExcelSheet(req, res) {

    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]

        let pageNo = req.body.pageNo || req.query.pageNo

        let limit = req.body.limit || req.query.limit

        let empCode = req.body.empCode || req.query.empCode



        let empName = req.body.empName || req.query.empName

        let subComp = req.body.subComp || req.query.subComp

        let branchId = req.body.branchId || req.query.branchId

       

        let departmentId = req.body.departmentId || req.query.departmentId

        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId

        let designationId = req.body.designationId || req.query.designationId

        let categoryId = req.body.categoryId || req.query.categoryId

        let assetId = req.body.assetId || req.query.assetId

        let taggedResponsible = req.body.taggedResponsible || req.query.taggedResponsible

        let requestFromDate = req.body.requestFromDate || req.query.requestFromDate

        let requestToDate = req.body.requestToDate || req.query.requestToDate

        let status = req.body.status || req.query.status



        let apiData = await fetchData({

            token, pageNo, limit, empCode, empName, subComp, branchId, departmentId, subDepartmentId, designationId,categoryId,assetId,taggedResponsible,requestFromDate,requestToDate,status

        })



        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', `attachment; filename="acceptAlottedAssetExcel.xlsx"`);



        (await getExcel).write(res)



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = { getAcceptAllotAssetListExcel, getAcceptAllotAssetListExcelSheet }









