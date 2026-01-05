let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const getPayout = async (req, res) => {
try {
    const decodedToken = req.headerSession;
    const userId = decodedToken.userId;
    const companyId = decodedToken.companyId;
    const branch_Id = decodedToken.branchId;
    const mainUserId = decodedToken.mainUserId;
    let db = sequelize(companyId);

    let data = req.body;
    let { year,month, empCode, empId, subCompanyId, branchId, departmentId, subDepartmentId, locationId } = data
    let countQuery = await db.query(`
        SELECT COUNT(*) AS total
        FROM eve_acc_employee
        WHERE status='A'
        AND employeeType='Blue Collar'
       
                        AND (employeeCurrentStatus = '' 
                        OR employeeCurrentStatus IS NULL 
                        OR employeeCurrentStatus = 'Active'
                        OR employeeCurrentStatus = 'resignation' 
                        OR employeeCurrentStatus = 'joining'
                        OR employeeCurrentStatus = 'termination'
                        OR employeeCurrentStatus = 'release' 
                        OR employeeCurrentStatus = 'offerletter')

                        AND (:empCode IS NULL OR employeeCode=:empCode)
                        AND (:empId IS NULL OR id=:empId)
                        AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
                        AND (:branchId IS NULL OR employeeBranchId=:branchId)
                        AND (:departmentId IS NULL OR employeeDepartmentId=:departmentId)
                        AND (:subDepartmentId IS NULL OR employeeSubDepartmentId=:subDepartmentId)
                        AND (:locationId IS NULL OR locationID=:locationId)
        
        
`, {
        replacements: {
            empCode: empCode || null,
            empId: empId || null,
            subCompanyId: subCompanyId || null,
            branchId: branchId || null,
            departmentId: departmentId || null,
            subDepartmentId: subDepartmentId || null,
            locationId: locationId || null,
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

    let getData = await db.query(
        `
        SELECT 
         (@row_number:=@row_number + 1) AS 'slno',
         id AS empId,
         employeeName,
         employeeCode,
         employeeSubCompanyId,
         employeeBranchId,
         employeeDepartmentId,
         employeeSubDepartmentId,
         employeeDesignationId,
         employmentLeaveType,
         employeeType,
         locationID

         FROM eve_acc_employee 
         CROSS JOIN (SELECT @row_number := :offset) AS init
         WHERE status='A'
         AND employeeType='Blue Collar'

         

                        AND (employeeCurrentStatus = '' 
                        OR employeeCurrentStatus IS NULL 
                        OR employeeCurrentStatus = 'Active'
                        OR employeeCurrentStatus = 'resignation' 
                        OR employeeCurrentStatus = 'joining'
                        OR employeeCurrentStatus = 'termination'
                        OR employeeCurrentStatus = 'release' 
                        OR employeeCurrentStatus = 'offerletter')

                          AND (:empCode IS NULL OR employeeCode=:empCode)
                            AND (:empId IS NULL OR id=:empId)
                              AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
                               AND (:branchId IS NULL OR employeeBranchId=:branchId)
                                AND (:departmentId IS NULL OR employeeDepartmentId=:departmentId)
                                 AND (:subDepartmentId IS NULL OR employeeSubDepartmentId=:subDepartmentId)
                                   AND (:locationId IS NULL OR locationID=:locationId)

         ORDER BY employeeName               
         LIMIT :limit
         OFFSET :offset  

        `, 
        {
        replacements: {
            limit: limit,
            offset: offset,
            empCode: empCode || null,
            empId: empId || null,
            subCompanyId: subCompanyId || null,
            branchId: branchId || null,
            departmentId: departmentId || null,
            subDepartmentId: subDepartmentId || null,
            locationId: locationId || null,
        },
        type: QueryTypes.SELECT
    })

    let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
    let NoOfdaysInMonth = parseInt(daysInCurrentMonth)
    let totalPfEarned=0
    let totalEsicEarned=0
    let totalIncentivePay=0
    let totalVariablePay=0
    let totalOtEarned=0
    let totalPayout=0
  
    

    await Promise.all(getData.map(async e => {
        e['subCompany'] = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
        e['branch'] = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
        e['Department'] = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
        e['subDepartment'] = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
        e['designation'] = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
        e.category=''
        e.wageTemplate=''
        e['lastPayoutOn']=''
        e.pendingPayoutDays=''
        e.pfEarned=''
        e.esicEarned=''
        e.incentivePay=''
        e.variablePay=''
        e.totalOtEarned=''
        e.totalPayout=''
        e.status=''
        e.location=await myFunc.getLocationNameById(e.locationID,db)
        const appDetailsObj = [];
        for (let i = 1; i <= NoOfdaysInMonth; i++) {

            let number = i.toString().padStart(2, '0');
            let empDtStrdate = new Date(`${year}-${month}-${number}`);
            let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

            let newObj = {
                crtDate: `${year}-${month}-${number}`,
                empDtStr: `${timestamp}`,
                workingHours:'--',
                workingPaid:'--',
                overTimeHours:'--',
                overTimePaid:'--',
                status:'unpaid',
            }
            appDetailsObj.push(newObj);
        }
        e.appDetails = appDetailsObj
        const attendanceApprovedModel=await db.query(
            `
            SELECT date,attenDanceWorkingHrs,overTime_InMinute
            FROM eve_acc_employee_attendence_approved
            WHERE status='A'
            AND YEAR(date)=:year
            AND MONTH(date)=:month
            AND employeeId=:empId

            `,
            {
                replacements:{
                    year:year,
                    month:month,
                    empId:e.empId

                },type:QueryTypes.SELECT
            }
        )
   
    let attendanceMap = new Map()

    attendanceApprovedModel.map(x => attendanceMap.set(x.date, x))

    await Promise.all(e.appDetails.map(async x => {
        
        if(attendanceMap.has(x.crtDate)){
            let attendanceRecord = attendanceMap.get(x.crtDate)
            if(attendanceRecord.attenDanceWorkingHrs!==null){
                x.workingHours=attendanceRecord.attenDanceWorkingHrs
                x.status='paid'
            }
            if(attendanceRecord.overTime_InMinute!==null){
                x.overTimeHours=myFunc.convertMinutesToHHMM(attendanceRecord.overTime_InMinute)
                x.status='paid'
            }
        }
    }))
    // console.log(attendanceApprovedModel);
    

})) 
    return res.status(200).json({
        status: true,
        pageNo: pageNo,
        recordedPerPage: limit,
        totalData: totalData,
        totalPfEarned:myFunc.formatAmount(totalPfEarned),
        totalEsicEarned:myFunc.formatAmount(totalEsicEarned),
        totalIncentivePay:myFunc.formatAmount(totalIncentivePay),
        totalVariablePay:myFunc.formatAmount(totalVariablePay),
        totalOtEarned:myFunc.formatAmount(totalOtEarned),
        totalPayout:myFunc.formatAmount(totalPayout),
        employee: (getData)
    });
    
} catch (error) {
    return res.status(500).json({status:false,msg:error.message,err:error.stack})
}
}
module.exports={getPayout}