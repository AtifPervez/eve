let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')

const getAssetAllotment=async(req,res)=>{
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)

        let data = req.body
        let { year, month, requestDateFrom, requestDateTo, empId, subCompId, branchId, departmentId, subDepartmentId, designationId, categoryId, assetId, taggedResponsibleId, status } = data
        // if (!year || !month) {
        //     return res.status(400).json({ status: false, msg: 'plz enter year and month' })
        // }

        let countQuery = await db.query(`
                                            SELECT COUNT(*) AS total
                                            FROM eve_hrm_employee_asset_allotment_details
                                            WHERE status='A'
                                            AND (:employeeId IS NULL OR employeeId=:employeeId)
                                            AND (:subCompanyId IS NULL OR subCompanyId=:subCompanyId)
                                            AND (:branchId IS NULL OR branchId=:branchId)
                                            AND (:departmentId IS NULL OR departmentId=:departmentId)
                                            AND (:subDepartmentId IS NULL OR subDepartmentId=:subDepartmentId)
                                            AND (:subDepartmentId IS NULL OR subDepartmentId=:subDepartmentId)
                                            AND (:categoryId IS NULL OR categoryId=:categoryId)
                                            AND (:assetId IS NULL OR assetId=:assetId)
                                            AND (:requestApprovalStatus IS NULL OR requestApprovalStatus=:requestApprovalStatus)
                                            AND (
                                                (:requestDateFrom IS NULL OR :requestDateTo IS NULL)
                                                OR (eve_hrm_employee_asset_allotment_details.requestDate BETWEEN :requestDateFrom AND :requestDateTo)
                                                )`,
            {
                replacements: {
                    employeeId: empId || null,
                    subCompanyId: subCompId || null,
                    branchId: branchId || null,
                    departmentId: departmentId || null,
                    subDepartmentId: subDepartmentId || null,
                    categoryId: categoryId || null,
                    assetId: assetId || null,
                    requestApprovalStatus: status || null,
                    requestDateFrom: requestDateFrom || null,
                    requestDateTo: requestDateTo || null,

                    year: year,
                    month: month

                },
                type: QueryTypes.SELECT
            })
        const totalData = countQuery[0].total

         if (totalData === 0) {
            return res.status(204).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || 10;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
                                      SELECT 
                                      (@row_number:=@row_number + 1) AS slno,
                                      employeeId,
                                      subCompanyId,
                                      branchId,
                                      departmentId,
                                      subDepartmentId,
                                      categoryId,
                                      assetId,
                                      quantity,
                                      serialNo,
                                      createdBy,
                                      DATE_FORMAT(requestDate, '%d-%m-%Y') AS requestDate,
                                      DATE_FORMAT(addedDate, '%d-%m-%Y') AS allotedDate,
                                      reason,
                                      requestApprovalStatus AS status 
                                      FROM eve_hrm_employee_asset_allotment_details 
                                      CROSS JOIN (SELECT @row_number := :offset) AS init
                                      WHERE status='A'
                                      AND (:employeeId IS NULL OR employeeId=:employeeId)
                                      AND (:subCompanyId IS NULL OR subCompanyId=:subCompanyId)
                                      AND (:branchId IS NULL OR branchId=:branchId)
                                      AND (:departmentId IS NULL OR departmentId=:departmentId)
                                      AND (:subDepartmentId IS NULL OR subDepartmentId=:subDepartmentId)
                                      AND (:categoryId IS NULL OR categoryId=:categoryId)
                                      AND (:assetId IS NULL OR assetId=:assetId)
                                      AND (
                                        (:requestDateFrom IS NULL OR :requestDateTo IS NULL)
                                        OR (eve_hrm_employee_asset_allotment_details.requestDate BETWEEN :requestDateFrom AND :requestDateTo)
                                        )
                                        LIMIT :limit
                                        OFFSET :offset
                                    
                                    
                                      `
            ,
            {
                replacements: {
                    limit: limit,
                    offset: offset,
                    employeeId: empId || null,
                    subCompanyId: subCompId || null,
                    branchId: branchId || null,
                    departmentId: departmentId || null,
                    subDepartmentId: subDepartmentId || null,
                    categoryId: categoryId || null,
                    assetId: assetId || null,
                    requestApprovalStatus: status || null,
                    requestDateFrom: requestDateFrom || null,
                    requestDateTo: requestDateTo || null,
                   
                },

                type: QueryTypes.SELECT
            })
            await Promise.all(getData.map(async (e) => {
                e.empCode = await myFunc.getEmpCodeFromEmpId(e.employeeId, db)
                e.empName = await myFunc.getEmployeeNameById(e.employeeId, db)
                e.subCompanyName = await myFunc.getSubCompanyNameById(e.subCompanyId, db)
                e.branchName = await myFunc.getBranchNameByBranchId(e.branchId, db)
                e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.departmentId, db)
                e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.subDepartmentId, db)
                e.designationId = await myFunc.getDesignationIdFromEmpId(e.employeeId, db)
                e.designationName = await myFunc.getDesignationNameById(e.designationId, db)
                e.categoryName = await myFunc.getAssetCategoryName(e.categoryId, db)
                e.taggedResponsibleId = await myFunc.taggedResponsiblePerson(e.categoryId, db)
                e.taggedResponsiblePerson = await myFunc.getEmployeeNameById(e.taggedResponsibleId, db)
                e.assetName = await myFunc.getAssetName(e.assetId, db)
                e.allotedBy=await myFunc.getEmployeeNameById(e.createdBy,db)
            }))
            if (taggedResponsibleId) {
                getData = getData.filter((e) => {
                    if (parseInt(taggedResponsibleId) === parseInt(e.taggedResponsibleId)) {
                        return true
                    }
    
                })
            }
            if (designationId) {
                getData = getData.filter((e) => {
                    if (parseInt(designationId) === parseInt(e.designationId)) {
                        return true
                    }
    
                })
            }
    
            if (empId || subCompId || branchId || departmentId || subDepartmentId || categoryId || assetId || status || requestDateFrom || requestDateTo || taggedResponsibleId || designationId) {
    
                if (taggedResponsibleId || designationId) {
    
                    getData.map((e, i) => e.slno = Number(i + 1))
    
                    return res.status(200).send({
                        status: true,
                        pageNo:pageNo,
                        recordedPerPage:limit,
                        totalData: getData.length,
                        employee: getData,
    
                    })
                }
    
                return res.status(200).send({
                    status: true,
                    pageNo:pageNo,
                    recordedPerPage:limit,
                    totalData: totalData,
                    // employee: assetDetails,
                    employee: getData,
    
                })
            }
            else {
    
                return res.status(200).send({
                    status: true,
                    pageNo:pageNo,
                    recordedPerPage:limit,
                    totalData: totalData,
                    employee: getData,
                    // employee: assetDetails,
    
                })
            }
        
    } catch (error) {
        return res.status(500).send({ status: false, err: error.message, msg: error.stack })

    }
}
module.exports={getAssetAllotment}