let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');

const getEmployeeBranchTransferHistoryExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)

        // const tokenUserId = '29'
        // let db = sequelize('59')

        let data = req.body;
        const { branchName, createdDate, currentBranch, email, empCode, employeeId, mobileNo, previousBranch, remark } = data
        const countQuery = await db.query(
            `
                            select COUNT(*) as total
                            
                            from eve_hrm_employee_branch_transfer_history as a                           
                            left join eve_acc_employee as b on a.employeeId=b.id 
                            where a.status='A'
                            and (:branchName is null or  a.createdByBranch=:branchName)
                            and (:currentBranch is null or  a.currentBranch=:currentBranch)
                            and (:previousBranch is null or  a.previousBranch=:previousBranch)
                            and (:createdDate is null or  date(a.createdDate) = :createdDate)
                            and (:email is null or b.employeeEmail=:email)
                            and (:empCode is null or b.employeeCode=:empCode)
                            and (:employeeId is null or  a.employeeId=:employeeId)
                            and (:mobileNo is null or    b.employeeMobile=:mobileNo)
                            and (:remark is null or    a.remark=:remark)
                 
                            
                                                                              
            `, {
            replacements: {
                branchName: branchName || null,
                currentBranch: currentBranch || null,
                previousBranch: previousBranch || null,
                createdDate: createdDate || null,
                email: email || null,
                empCode: empCode || null,
                employeeId: employeeId || null,
                mobileNo: mobileNo || null,
                remark: remark || null,


            }, type: QueryTypes.SELECT
        }
        )
        const totalData = countQuery[0]['total']
        if (totalData === 0) {
            return res.status(200).json({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;
        let getData = await db.query(
            `                        select 
                                     a.createdByBranch,
                                     date_format(a.createdDate,'%d-%m-%Y') as branchChangeDate,
                                     a.previousBranch,
                                     a.currentBranch,
                                     a.remark,
                                     a.employeeId,
                                     b.employeeName,
                                     b.employeeCode,
                                     b.employeeMobile,
                                     b.employeeEmail
                                     
                                     from eve_hrm_employee_branch_transfer_history as a                          
                                     left join eve_acc_employee as b on a.employeeId=b.id 
                      
                                     where a.status='A'

                                     and (:branchName is null or  a.createdByBranch=:branchName)
                                     and (:currentBranch is null or  a.currentBranch=:currentBranch)
                                     and (:previousBranch is null or  a.previousBranch=:previousBranch)
                                     and (:createdDate is null or  date(a.createdDate) = :createdDate)
                                          and (:email is null or b.employeeEmail=:email)
                                                and (:empCode is null or b.employeeCode=:empCode)
                                                     and (:employeeId is null or  a.employeeId=:employeeId)
                                                              and (:mobileNo is null or    b.employeeMobile=:mobileNo)
                                                                and (:remark is null or    a.remark=:remark)

                                     order by a.createdDate desc
                                     limit :limit
                                     offset :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    branchName: branchName || null,
                    currentBranch: currentBranch || null,
                    previousBranch: previousBranch || null,
                    createdDate: createdDate || null,
                    email: email || null,
                    empCode: empCode || null,
                    employeeId: employeeId || null,
                    mobileNo: mobileNo || null,
                    remark: remark || null,



                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async (e, i) => {
          
            e.createdByBranchName = await myFunc.getBranchNameByBranchId(e.createdByBranch, db)
            e.previousBranchName = await myFunc.getBranchNameByBranchId(e.previousBranch, db)
            e.currentBranchName = await myFunc.getBranchNameByBranchId(e.currentBranch, db)
        }))
        const excelData = getData.map((e, i) =>

        ({
            'Sl. No.': i + 1,
            'Created By Branch': e.createdByBranchName,
            'Branch Change Date': e.branchChangeDate,
            'Previous Branch': e.previousBranchName,
            'Current Branch': e.currentBranchName,
            'Remark': e.remark,
            'Employee Name': e.employeeName,
            'Employee Code': e.employeeCode,
            'Mobile Number': e.employeeMobile,
            'Email': e.employeeEmail,
        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo,
            totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)


        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, branchName, createdDate, currentBranch, email, empCode, employeeId, mobileNo, previousBranch, remark }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getEmployeeBranchTransferHistoryExcel`,
            data: { token, pageNo, limit, branchName, createdDate, currentBranch, email, empCode, employeeId, mobileNo, previousBranch, remark }
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
            row.height = 15

        });
    });
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };
    });
    worksheet.columns.forEach(column => {
        column.width = 20;
    });
    return workbook.xlsx
}

async function getEmployeeBranchTransferHistoryExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, branchName, createdDate, currentBranch, email, empCode, employeeId, mobileNo, previousBranch, remark } = data
        let apiData = await fetchData({ token, pageNo, limit, branchName, createdDate, currentBranch, email, empCode, employeeId, mobileNo, previousBranch, remark })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Employee Branch Transfer History.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getEmployeeBranchTransferHistoryExcel,getEmployeeBranchTransferHistoryExcelSheet }