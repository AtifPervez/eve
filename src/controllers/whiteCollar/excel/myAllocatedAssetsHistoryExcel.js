let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');

const getMyAllocatedAssetsHistoryExcel = async (req, res) => {
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
        const { } = data
        const countQuery = await db.query(
            `
                            select COUNT(*) as total
                            from eve_hrm_employee_asset_allotment_details as a  
                            where a.status='A'
                            and a.employeeId=:tokenUserId
                            and a.is_employee_accept='yes'
                     
                            
                                                                              
            `, {
            replacements: {
                tokenUserId: tokenUserId


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
            `                           select 
                                        a.assetId,
                                        b.assetName,
                                        (a.quantity) as 'allotedQuantity'
                                        from eve_hrm_employee_asset_allotment_details as a     
                                        left join eve_hrm_employee_set_asset_details as b on a.assetId=b.id
                                        where a.status='A'
                                        and a.employeeId=:tokenUserId
                                        and a.is_employee_accept='yes'
                                
                                        limit :limit
                                        offset :offset                                               
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    tokenUserId: tokenUserId




                }, type: QueryTypes.SELECT
            }
        )
        let totalAcceptQuantity = 0
        let totalReturnedQuantity = 0
        let totalRemainingQuantity = 0
        await Promise.all(getData.map(async (e, i) => {
            e.allotedQuantity = parseFloat(e.allotedQuantity)

            const assetReturnModel = await db.query(
                `
                              select sum(cast(quantity as decimal)) as returnedQuantity from eve_hrm_employee_asset_return_details
                              where status='A'
                              and assetId=:assetId
            `, {
                replacements: {
                    assetId: e.assetId
                },
                type: QueryTypes.SELECT
            })
            e.returnedQuantity = ((assetReturnModel[0]['returnedQuantity']));
            e.returnedQuantity = e.returnedQuantity === null ? 0 : parseFloat(e.returnedQuantity)
            e.remainingQuantity = ((e.allotedQuantity) - (e.returnedQuantity))
            totalAcceptQuantity += e.allotedQuantity
            totalReturnedQuantity += e.returnedQuantity
            totalRemainingQuantity += e.remainingQuantity




        }))
        const excelData = getData.map((e, i) =>

        ({
            'Sl. No.': i + 1,
            'Asset Name': e.assetName,
            'Asset Accepted': e.allotedQuantity,
            'Asset Returned': e.returnedQuantity,
            'Asset Remain': e.remainingQuantity,

        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit, 
            currentPage: pageNo, 
            'Total Items Accepted': `Total Items Accepted : ${totalAcceptQuantity}`, 
            'Total Items Returned': `Total Items Returned : ${totalReturnedQuantity}`, 
            'Total Items': `Total Items : ${totalRemainingQuantity}`,
            totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)


        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMyAllocatedAssetsHistoryExcel`,
            data: { token, pageNo, limit }
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
     let assetAcceptedIndex = header.indexOf('Asset Accepted')
     let assetReturnedIndex = header.indexOf('Asset Returned')
     let assetRemainIndex = header.indexOf('Asset Remain')

    let len = header.length
    let row = new Array(len).fill('')
   
    row[assetAcceptedIndex]=data['Total Items Accepted']
    row[assetReturnedIndex]=data['Total Items Returned']
    row[assetRemainIndex]=data['Total Items']
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

async function getMyAllocatedAssetsHistoryExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit } = data
        let apiData = await fetchData({ token, pageNo, limit })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="My Allocated Assets History.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getMyAllocatedAssetsHistoryExcel, getMyAllocatedAssetsHistoryExcelSheet }