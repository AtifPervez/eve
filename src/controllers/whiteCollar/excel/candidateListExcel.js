let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs')
const getCandidateListExcel=async(req,res)=>{
    try {
        const decodedToken = req.headerSession;
        const userId = decodedToken.userId;
        const companyId = decodedToken.companyId;
        const branch_Id = decodedToken.branchId;
        const mainUserId = decodedToken.mainUserId;
        let db = sequelize(companyId);
        // let db = sequelize('59');

        let data = req.body;
        let { name,branchName, contactNo, dateOfBirth, email, formDate, gender, interviewStatus, postAppliedFor,toDate } = data
        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
            FROM eve_hrm_candidate
            WHERE status='A'
            AND (:name IS NULL OR name=:name)        
            AND (:branchName IS NULL OR branchId=:branchName)        
            AND (:contactNo IS NULL OR contactNo=:contactNo)        
            AND (:email IS NULL OR email=:email)        
            AND (:gender IS NULL OR gender=:gender)        
            AND (:postAppliedFor IS NULL OR postAppliedFor=:postAppliedFor)        
            AND (:dateOfBirth IS NULL OR dateOfBirth=:dateOfBirth)      
            AND (:interviewStatus IS NULL OR interviewStatusId=:interviewStatus)      

            AND (:formDate IS NULL OR createdDate >= STR_TO_DATE(:formDate, '%d-%m-%Y'))        
            AND (:toDate IS NULL OR createdDate <= STR_TO_DATE(:toDate, '%d-%m-%Y'))  
`, {
            replacements: {
                name:name||null,
                branchName:branchName||null,
                contactNo:contactNo||null,
                email:email||null,
                gender:gender||null,
                postAppliedFor:postAppliedFor||null,
                dateOfBirth:dateOfBirth||null,
                formDate:formDate||null,
                toDate:toDate||null,
                interviewStatus:interviewStatus||null,
             

            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total

        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
            SELECT 
             (@row_number:=@row_number + 1) AS 'slno',
             name,
             branchId,
             subCompanyId,
             contactNo,
             email,
             gender,
             postAppliedFor,
             dateOfBirth,
             interviewStatusId,
             DATE_FORMAT(createdDate,'%d-%m-%Y') AS createDate

              FROM eve_hrm_candidate 
                CROSS JOIN (SELECT @row_number := :offset) AS init
              WHERE status='A'

               AND (:name IS NULL OR name=:name)   
                 AND (:branchName IS NULL OR branchId=:branchName)
                   AND (:contactNo IS NULL OR contactNo=:contactNo)
                   AND (:email IS NULL OR email=:email)
                     AND (:gender IS NULL OR gender=:gender)
                      AND (:postAppliedFor IS NULL OR postAppliedFor=:postAppliedFor)
                         AND (:dateOfBirth IS NULL OR dateOfBirth=:dateOfBirth)
                           AND (:interviewStatus IS NULL OR interviewStatusId=:interviewStatus)  
                 
           AND (:formDate IS NULL OR createdDate >= STR_TO_DATE(:formDate, '%d-%m-%Y'))        
           AND (:toDate IS NULL OR createdDate <= STR_TO_DATE(:toDate, '%d-%m-%Y'))               

              ORDER BY createdDate DESC           
             LIMIT :limit
             OFFSET :offset  

            `, {
            replacements: {
                limit: limit,
                offset: offset,
                name:name||null,
                branchName:branchName||null,
                contactNo:contactNo||null,
                email:email||null,
                gender:gender||null,
                postAppliedFor:postAppliedFor||null,
                dateOfBirth:dateOfBirth||null,
                formDate:formDate||null,
                toDate:toDate||null,
                interviewStatus:interviewStatus||null,
            
            },
            type: QueryTypes.SELECT
        })
        await Promise.all(getData.map(async e => {
            e['branch'] = await myFunc.getBranchNameByBranchId(e.branchId, db)
            e['interviewStatus']=await myFunc.getInterviewStatus(e.interviewStatusId,db)
            e['postApplied']=await myFunc.getDesignationNameById(e.postAppliedFor,db)
        }))
        const candidateExcel=getData.map(e=>({
            'Sl No.':e.slno,
            'Created Date':e.createDate,
            'Candidate Name':e.name,
            'Branch':e.branch,
            'Contact No':e.contactNo,
            'Email':e.email,
            'Gender':e.gender,
            'Post Applied':e.postApplied,
            'Date Of Birth':e.dateOfBirth,
            'Interview Status':e.interviewStatus,
        }))
          
          
        return res.status(200).json({ status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData, 
            // employee: getData 
            employee: myFunc.replaceEmptyValues(candidateExcel)
        });
        
    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack });
    }
}


async function fetchData({token, pageNo, limit,  name,branchName, contactNo, dateOfBirth, email, formDate, gender, interviewStatus, postAppliedFor,toDate }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getCandidateListExcel`,

            data: { token, pageNo,  limit,name,branchName, contactNo, dateOfBirth, email, formDate, gender, interviewStatus, postAppliedFor,toDate }

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
            row.height = 30

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
    

    
    return workbook.xlsx



}

async function getCandidateListExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let name = req.body.name || req.query.name
        let branchName = req.body.branchName || req.query.branchName

        let contactNo = req.body.contactNo || req.query.contactNo
        let dateOfBirth = req.body.dateOfBirth || req.query.dateOfBirth
        let email = req.body.email || req.query.email
       
        let formDate = req.body.formDate || req.query.formDate
        let gender = req.body.gender || req.query.gender
        let interviewStatus = req.body.interviewStatus || req.query.interviewStatus
        let postAppliedFor = req.body.postAppliedFor || req.query.postAppliedFor
        let toDate = req.body.toDate || req.query.toDate
       

        let apiData = await fetchData({
            token, pageNo,  limit,name,branchName, contactNo, dateOfBirth, email, formDate, gender, interviewStatus, postAppliedFor,toDate
        })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="candidateList.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports={getCandidateListExcel,getCandidateListExcelSheet}
