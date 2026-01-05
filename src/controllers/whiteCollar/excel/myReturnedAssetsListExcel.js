let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getMyReturnedAssetsListExcel = async (req, res) => {
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
        const { assetName, fromDate, Quantity, toDate } = data
        const countQuery = await db.query(
            `
                            select COUNT(*) as total
                            from eve_hrm_employee_asset_return_details as a  
                            where a.status='A'
                            and a.employeeId=:tokenUserId 
                            and (:quantity is null or a.quantity=:quantity)                                            
                            and (:assetName is null or a.assetId=:assetName)                                            
           AND (:fromDate IS NULL OR STR_TO_DATE(a.imageDate, '%d-%m-%Y') >= STR_TO_DATE(:fromDate, '%Y-%m-%d'))
           AND (:toDate IS NULL OR STR_TO_DATE(a.imageDate, '%d-%m-%Y') <= STR_TO_DATE(:toDate, '%Y-%m-%d'))          

            `, {
            replacements: {
                tokenUserId: tokenUserId,
                assetName: assetName || null,
                quantity: Quantity || null,
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

            `                         select 
                                      a.assetId,
                                      a.quantity,
                                      date_format(a.returnDate,'%d-%m-%Y') as returnDate,
                                      a.serialNo,
                                      a.imageDate  
                                     from eve_hrm_employee_asset_return_details as a     
                                     where a.status='A'
                            
                                     and a.employeeId=:tokenUserId
                                     and (:quantity is null or a.quantity=:quantity)
                                    and (:assetName is null or a.assetId=:assetName)   
                 AND (:fromDate IS NULL OR STR_TO_DATE(a.imageDate, '%d-%m-%Y') >= STR_TO_DATE(:fromDate, '%Y-%m-%d'))
                 AND (:toDate IS NULL OR STR_TO_DATE(a.imageDate, '%d-%m-%Y') <= STR_TO_DATE(:toDate, '%Y-%m-%d'))     
                                     order by a.createdDate desc
                                     limit :limit 
                                    offset :offset                                                                          
                                  
                               
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    tokenUserId: tokenUserId,
                    assetName: assetName || null,
                    quantity: Quantity || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,

                }, type: QueryTypes.SELECT
            }
        )
        let totalQuantity = 0
        await Promise.all(getData.map(async (e, i) => {
            totalQuantity += parseFloat(e.quantity)
            const assetDetailsModel = await db.query(
                ` 
                                              select assetName 
                                              from eve_hrm_employee_set_asset_details
                                              where status='A'
                                              and id=:id 
            
            `, {
                replacements: {
                    id: e.assetId

                }, type: QueryTypes.SELECT
            })
            if (assetDetailsModel.length > 0) {
                e.assetName = assetDetailsModel[0]['assetName']
                
            }
            else {
                e.assetName = ''
            }
         
            

        }))
        const excelData = getData.map((e, i) =>
        ({
            'Sl. No.': i + 1,
            // 'Returned Date': e.returnDate,
            'Asset Name': e.assetName,
            'Quantity': e.quantity,
            'Serial Number': e.serialNo,
            'Image Taken On': e.imageDate,
        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit,
            currentPage: pageNo,
            totalQuantity: `Total Quantity : ${totalQuantity}`,
            totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit,assetName, fromDate, Quantity, toDate }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyReturnedAssetListExcel`,
            data: { token, pageNo, limit, assetName, fromDate, Quantity, toDate }
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

async function getMyReturnedAssetsListExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit,assetName, fromDate, Quantity, toDate} = data
        let apiData = await fetchData({ token, pageNo, limit, assetName, fromDate, Quantity, toDate })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Returned Assets List.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getMyReturnedAssetsListExcel, getMyReturnedAssetsListExcelSheet }