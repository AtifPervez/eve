let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');

const getCvsharedHistoryExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)

      
        // const tokenUserId = '29'
        // let db = sequelize('59');
        
        let data = req.body;
        const {name,contactNo,email,gender,dateOfBirth,formDate,toDate,interviewStatus,branchName  } = data
        const countQuery = await db.query(
            `
                                        SELECT COUNT(*) AS total
                                        FROM eve_hrm_candidate 
                                       
                                        WHERE status='A'  
                                         AND shareWith != ''
                                        AND (:name IS NULL OR REPLACE(name,'  ',' ')=REPLACE(:name,'  ',' '))
                                        AND (:contactNo IS NULL OR contactNo=:contactNo)
                                        AND (:email IS NULL OR email=:email)
                                        AND (:gender IS NULL OR gender=:gender)
                                        AND (:dateOfBirth IS NULL OR dateOfBirth=:dateOfBirth)
                                          AND (:formDate IS NULL OR createdDate >= STR_TO_DATE(:formDate,'%d-%m-%Y'))
                                       AND (:toDate IS NULL OR createdDate <= STR_TO_DATE(:toDate,'%d-%m-%Y'))
                                             AND (:interviewStatus IS NULL OR interviewStatusId=:interviewStatus)
                                             AND (:branchName IS NULL OR branchId=:branchName)
                                    
                                      
            `, {
            replacements: {
              
                name:name||null,
                contactNo:contactNo||null,
                email:email||null,
                gender:gender||null,
                dateOfBirth:dateOfBirth||null,
                formDate:formDate||null,
                toDate:toDate||null,
                interviewStatus:interviewStatus||null,
                branchName:branchName||null,



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
            `
                               SELECT 
                               (@row_number:=@row_number + 1) AS 'slno',
                               DATE_FORMAT(createdDate,'%d-%m-%Y') AS newDate,
                               name,
                               contactNo,
                               email,
                               gender,
                               dateOfBirth,
                               interviewStatusId,
                               shareWith,
                               createdByBranch
                             
                               FROM eve_hrm_candidate
                               
                            
                               CROSS JOIN (SELECT @row_number := :offset) AS init

                               WHERE status='A'
                               
                                AND shareWith != ''

                               AND (:name IS NULL OR REPLACE(name,'  ',' ')=REPLACE(:name,'  ',' '))

                               AND (:contactNo IS NULL OR contactNo=:contactNo)
                                 AND (:email IS NULL OR email=:email)
                                   AND (:gender IS NULL OR gender=:gender)
                                       AND (:dateOfBirth IS NULL OR dateOfBirth=:dateOfBirth)

                                       AND (:interviewStatus IS NULL OR interviewStatusId=:interviewStatus)
                                         AND (:branchName IS NULL OR branchId=:branchName)
                                       AND (:formDate IS NULL OR createdDate >= STR_TO_DATE(:formDate,'%d-%m-%Y'))
                                       AND (:toDate IS NULL OR createdDate <= STR_TO_DATE(:toDate,'%d-%m-%Y'))
                                  
                               ORDER BY createdDate DESC
                                 
                               LIMIT   :limit
                                
                               OFFSET :offset
                            
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    name:name||null,
                    contactNo:contactNo||null,
                    email:email||null,
                    gender:gender||null,
                    dateOfBirth:dateOfBirth||null,
                    formDate:formDate||null,
                    toDate:toDate||null,
                    interviewStatus:interviewStatus||null,
                    branchName:branchName||null,
                  



                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async e => {
         e.interviewStatus=await myFunc.getInterviewStatus(e.interviewStatusId,db)
         e.branchName=await myFunc.getBranchNameByBranchId(e.createdByBranch,db)


        }))
        const excelData = getData.map(e => ({
            'Sl. No.': e.slno,
            'Created Date': e.newDate,
            'Candidate Name': e.name,
            'Contact No': e.contactNo,
            'Email':e.email,
            'Branch':e.branchName,
            'Gender':e.gender,
            'Date Of Birth':e.dateOfBirth,
            'Interview Status':e.interviewStatus,
           
        }))

        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo, totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)

        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit,name,contactNo,email,gender,dateOfBirth,formDate,toDate,interviewStatus,branchName }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getCvSharedHistoryExcel`,

            data: { token, pageNo, limit,name,contactNo,email,gender,dateOfBirth,formDate,toDate,interviewStatus,branchName }

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

async function getCvsharedHistoryExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }

        let { pageNo, limit,name,contactNo,email,gender,dateOfBirth,formDate,toDate,interviewStatus,branchName  } = data

        let apiData = await fetchData({token, pageNo, limit,name,contactNo,email,gender,dateOfBirth,formDate,toDate,interviewStatus,branchName})

        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="CV Shared History.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getCvsharedHistoryExcel,getCvsharedHistoryExcelSheet }