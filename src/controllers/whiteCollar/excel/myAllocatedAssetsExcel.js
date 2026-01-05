let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getMyAllocatedAssetsExcel = async (req, res) => {
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
        const { assetName, fromDate, quantity, toDate } = data
        const countQuery = await db.query(
            `
                            select COUNT(*) as total
                            from eve_hrm_employee_asset_allotment_details as a  
                            where a.status='A'
                            and a.employeeId=:tokenUserId
                            and (:assetName is null or a.assetId=:assetName) 
                                and (:quantity is null or a.quantity=:quantity) 
                            and (:fromDate is null or date(a.createdDate) >= str_to_date(:fromDate,'%d-%m-%Y')) 
                            and (:toDate is null or date(a.createdDate) <= str_to_date(:toDate,'%d-%m-%Y')) 
                   
                                                                              
            `, {
            replacements: {
                tokenUserId: tokenUserId,
                assetName: assetName || null,
                quantity: quantity || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
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
                                    a.assetId,
                                    b.assetName,
                                    (a.quantity),
                                    a.serialNo,
                                    a.is_employee_accept as employeeAccept,
                                    date_format(a.createdDate,'%d-%m-%Y') as allocatedDate
                                    from eve_hrm_employee_asset_allotment_details as a     
                                    left join eve_hrm_employee_set_asset_details as b on a.assetId=b.id
                                    where a.status='A'
                                    and (:assetName is null or a.assetId=:assetName) 
                                    and (:quantity is null or a.quantity=:quantity) 
                                    and (:fromDate is null or date(a.createdDate) >= str_to_date(:fromDate,'%d-%m-%Y')) 
                                    and (:toDate is null or date(a.createdDate) <= str_to_date(:toDate,'%d-%m-%Y')) 
                                    and a.employeeId=:tokenUserId
                                    limit :limit offset :offset                                                                          
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    tokenUserId: tokenUserId,
                    assetName: assetName || null,
                    quantity: quantity || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,

                }, type: QueryTypes.SELECT
            }
        )
        let totalQuantity = 0
        await Promise.all(getData.map(async (e, i) => {
            e.action = e.employeeAccept === 'yes' ? 'Accepted' : e.employeeAccept === 'no' ? 'Rejected' : e.action
            totalQuantity += parseFloat(e.quantity)
        }))
        const excelData = getData.map((e, i) =>
        ({
            'Sl. No.': i + 1,
            'Allocated Date': e.allocatedDate,
            'Asset Name': e.assetName,
            'Quantity': e.quantity,
            'Serial Number': e.serialNo,
            'Action': e.action,
        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit,
            currentPage: pageNo,
            totalQuantity: `Total Accepted Quantity : ${totalQuantity}`,
            totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, assetName, fromDate, quantity, toDate }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyAllocatedAssetsExcel`,
            data: { token, pageNo, limit, assetName, fromDate, quantity, toDate }
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
    let quantityIndex = header.indexOf('Quantity')
    

    let len = header.length
    let row = new Array(len).fill('')

    row[quantityIndex] = data['totalQuantity']
   
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
            row.height = 15

        });
    });
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };
    });
    worksheet.columns.forEach(column => {
        column.width = 30;
    });
    const lastRow = worksheet.lastRow;

    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    return workbook.xlsx
}

async function getMyAllocatedAssetsExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, assetName, fromDate, quantity, toDate } = data
        let apiData = await fetchData({ token, pageNo, limit, assetName, fromDate, quantity, toDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Allocated Assets List.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getMyAllocatedAssetsExcel, getMyAllocatedAssetsExcelSheet }