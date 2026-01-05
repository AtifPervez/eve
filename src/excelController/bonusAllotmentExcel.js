let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const moment = require('moment')

const axios = require('axios')

const ExcelJS = require('exceljs')

const phpUnserialize = require('php-serialize');

//     eve/hr_api/model/hr-model-bonus-allotmrnt.php

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

        return '--'

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

        return '--'

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

        return '--'

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

        return '--'

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

        return '--'

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

        return '--'

    }

}

function convertDateDDMMYYYY(date) {



    let parsedDate = moment(date)

    let formattedDate = parsedDate.format('DD-MM-YYYY')

    return formattedDate

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

        return '--'

    }

}

function formatAmount(numericString) {



    if (numericString != null) {

        let numericValue = numericString

        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return formattedString

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

        return '--'

    }

}

function convertMonthName(monthNumber) {

    const months = [

        "January", "February", "March", "April", "May", "June", "July",

        "August", "September", "October", "November", "December"

    ];



    // Subtracting 1 from monthNumber since JavaScript months are zero-based (0 for January, 11 for December)

    const monthIndex = parseInt(monthNumber) - 1;

    

    if (monthIndex >= 0 && monthIndex < 12) {

        return months[monthIndex];

    } else {

        return "Invalid month";

    }

}







const getBonusAllotmentExcel = async (req, res) => {

    try {



        const userId = '29'

        let db = sequelize('59')

        let data = req.body

        let { month, year } = data

        // `bonus_payble`.`id`,`bonus_payble`.`bonusLabel`,



        //                                     `bonus_payble`.`appliedMonths`,`bonus_payble`.`addToPayslip`

        let getData = await db.query(`

                                    SELECT 

                                    emp.id AS empId,

                                    emp.employeeName AS name,

                                    emp.employeeBranchId AS branchId,

                                    emp.employeeDesignationId AS designationId,

                                    emp.employeeDepartmentId AS departmentId,

                                    emp.employeeCode,

                                    emp.employeeSubcompanyId AS subCompanyId,

                                    emp.employeeSubDepartmentId AS subDepartmentId,

                                    bonus.id AS bonusId,

                                    bonus.bonusLabel,

                                    bonus.appliedMonths,

                                    bonus.addToPayslip,

                                    bonusMaster.bonusDetails

                                    FROM eve_acc_employee AS emp

                                    LEFT JOIN eve_employee_bonus_payble_details AS bonus

                                    ON emp.id=bonus.employeeId

                                    LEFT JOIN eve_employee_bonus_master AS bonusMaster

                                    ON 

                                    (

                                        emp.employeeBranchId=bonusMaster.branchId 

                                        AND emp.employeeSubcompanyId=bonusMaster.subCompanyId

                                    )

                                    WHERE emp.status='A'

                                    AND (employeeCurrentStatus = '' 

                                    OR employeeCurrentStatus IS NULL 

                                    OR employeeCurrentStatus = 'Active'

                                    OR employeeCurrentStatus = 'resignation' 

                                    OR employeeCurrentStatus = 'joining'

                                    OR employeeCurrentStatus = 'termination'

                                    OR employeeCurrentStatus = 'release' 

                                    OR employeeCurrentStatus = 'offerletter')

                                    ORDER BY emp.employeeName

                                    `,

            {

                replacements: {



                },

                type: QueryTypes.SELECT

            })

            let jan=0,feb=0,march=0,apr=0,may=0,june=0,july=0,aug=0,sep=0,oct=0,nov=0,dec=0

        const months = [

            "January", "February", "March", "April",

            "May", "June", "July", "August",

            "September", "October", "November", "December"

        ];

        await Promise.all(getData.map(async e => {

            e.branchName = await getBranchNameByBranchId(e.branchId, db)

            e.designationName = await getDesignationNameById(e.designationId, db)

            e.departmentName = await departmentNameByDepartmentId(e.departmentId, db)

            e.subCompanyName = await getSubCompanyNameById(e.subCompanyId, db)

            e.subDepartmentName = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentId, db)

            e.bonusLabel = e.bonusLabel === null ? '--' : e.bonusLabel

            e.appliedMonths = e.appliedMonths === null ? '--' : e.appliedMonths

            e.addToPayslip = e.addToPayslip === null ? '--' : e.addToPayslip

            e.employeeCode = e.employeeCode === null ? '--' : e.employeeCode

            if(e.appliedMonths!='--'){



                e.monthName=convertMonthName(e.appliedMonths)

            }

            else{

                e.monthName='--'

            }

            

            if (e.bonusDetails !== null) {



                e.bonusDetails = phpUnserialize.unserialize(e.bonusDetails)



                for(let i in e.bonusDetails){

                    let obj=e.bonusDetails[i]

                    if(typeof obj!=='object'){

                        continue

                    }

                    e[obj.calculatedOn]=obj.bonusAmount

                    e.bonusInPercentage=e.percentage

                    e.bonusInAmount=e.amount

                }



            }

            if(!e.bonusInAmount){

                e.bonusInAmount='--'

            }

           

            months.forEach((month, index) => {

                e[month] = 0;

            });

            if (e.hasOwnProperty("appliedMonths") && e.appliedMonths != '--'&&e.amount) {

                let appliedMonthIndex = parseInt(e["appliedMonths"]) - 1;

                let appliedMonth = months[appliedMonthIndex];

                e[appliedMonth] = parseInt(e["amount"]);

            }

            

               jan+=e.January

            e.January=formatAmount(e.January)

            feb+=e.February

            e.February=formatAmount(e.February)

            march+=e.March

            e.March=formatAmount(e.March)

            apr+=e.April

            e.April=formatAmount(e.April)

            may+=e.May

            e.May=formatAmount(e.May)

            june+=e.June

            e.June=formatAmount(e.June)

            july+=e.July

            e.July=formatAmount(e.July)

            aug+=e.August

            e.August=formatAmount(e.August)

            sep+=e.September

            e.September=formatAmount(e.September)

            oct+=e.October

            e.October=formatAmount(e.October)

            nov+=e.November

            e.November=formatAmount(e.November)

            dec+=e.December

            e.December=formatAmount(e.December)

        }))



        let bonusExcel=getData.map((e,i)=>({

            'Sl. No.': Number(i + 1),

            'Employee Code': e.employeeCode,

            'Employee Name': e.name,

            'Sub Company Name': e.subCompanyName,

            'Branch': e.branchName,

            'Department': e.departmentName,

            'Sub Department': e.subDepartmentName,

            'Designation': e.designationName,

            'Bonus Label':e.bonusLabel,

            'Bonus Amount':e.bonusInAmount,

            'Applied Month(s)':e.monthName,

            'Add to payslip':e.addToPayslip,

            'April':e.April,

            'May':e.May,

            'June':e.June,

            "July": e.July,

            "August": e.August,

            "September": e.September,

            "October": e.October,

            "November": e.November,

            "December": e.December,

            "January": e.January,

            "February": e.February,

            "March": e.March,





             

        }))













        getData.map(e => delete e.bonusDetails)

        return res.status(200).json({

            jan:formatAmount(jan),

            feb:formatAmount(feb),

            march:formatAmount(march),

            apr:formatAmount(apr),

            may:formatAmount(may),

            june:formatAmount(june),

            july:formatAmount(july),

            aug:formatAmount(aug),

            sep:formatAmount(sep),

            oct:formatAmount(oct),

            nov:formatAmount(nov),

            dec:formatAmount(dec),

            totalData: getData.length, 

            // employee: getData 

            employee: bonusExcel

        })



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



async function fetchData({ pageNo, limit, employeeCode, biometricAttendanceId, name, subCompanyId, branchId, location, departmentNameId, subDepartmentId, designationNewId, status, companyFromDate, companyToDate }) {



    try {

        const config = {



            headers: { 'Content-Type': 'application/json' },

            method: 'POST',

            // url: 'http://localhost:5000/setting/bonus/getBonusAllotmentExcel',

            url:`${process.env.BASE_URL}/setting/bonus/getBonusAllotmentExcel`,



            data: { pageNo, limit, employeeCode, biometricAttendanceId, name, subCompanyId, branchId, location, departmentNameId, subDepartmentId, designationNewId, status, companyFromDate, companyToDate }



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

     

    let aprilIndex=header.indexOf('April')

    let mayIndex=header.indexOf('May')

    let juneIndex=header.indexOf('June')

    let julyIndex=header.indexOf('July')

    let augustIndex=header.indexOf('August')

    let sepIndex=header.indexOf('September')

    let octIndex=header.indexOf('October')

    let novIndex=header.indexOf('November')

    let decIndex=header.indexOf('December')

    let janIndex=header.indexOf('January')

    let febIndex=header.indexOf('February')

    let marchIndex=header.indexOf('March')

    let len = header.length

    let row = new Array(len).fill('')

    row[aprilIndex] = data.apr

    row[mayIndex] = data.may

    row[juneIndex] = data.june

    row[julyIndex] = data.july

    row[augustIndex] = data.aug

    row[sepIndex] = data.sep

    row[octIndex] = data.oct

    row[novIndex] = data.nov

    row[decIndex] = data.dec

    row[janIndex] = data.jan

    row[febIndex] = data.feb

    row[marchIndex] = data.march

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

        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }

        cell.font = { bold: true };



    });



    worksheet.columns.forEach(column => {

        column.width = 20;

    });

    const lastRow = worksheet.lastRow;

    lastRow.eachCell((cell, colNumber) => {

        cell.font = { bold: true };

    });

    return workbook.xlsx

}



async function getBonusAllotmentExcelSheet(req, res) {

    try {

        let pageNo = req.body.pageNo || req.query.pageNo

        let limit = req.body.limit || req.query.limit

        let employeeCode = req.body.employeeCode || req.query.employeeCode

        let biometricAttendanceId = req.body.biometricAttendanceId || req.query.biometricAttendanceId

        let name = req.body.name || req.query.name

        let subCompanyId = req.body.subCompanyId || req.query.subCompanyId

        let branchId = req.body.branchId || req.query.branchId

        let location = req.body.location || req.query.location

        let departmentNameId = req.body.departmentNameId || req.query.departmentNameId

        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId

        let designationNewId = req.body.designationNewId || req.query.designationNewId

        let status = req.body.status || req.query.status

        let companyFromDate = req.body.companyFromDate || req.query.companyFromDate

        let companyToDate = req.body.companyToDate || req.query.companyToDate







        let apiData = await fetchData({

            pageNo, limit, employeeCode, biometricAttendanceId, name, subCompanyId, branchId, location, departmentNameId, subDepartmentId, designationNewId, status, companyFromDate, companyToDate

        })



        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', `attachment; filename="bonusAllotmentExcel.xlsx"`);



        (await getExcel).write(res)



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



module.exports = { getBonusAllotmentExcel,getBonusAllotmentExcelSheet }