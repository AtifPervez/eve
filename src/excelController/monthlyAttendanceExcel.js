let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const ExcelJS = require('exceljs')
const myFunc = require('../functions/functions')
const dayjs = require('dayjs');


const getDateRange = (start, end) => {
    let dates = [];
    let current = new Date(start);
    end = new Date(end);

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]); // Format: YYYY-MM-DD
        current.setDate(current.getDate() + 1);
    }
    return dates;
};



// Function to calculate working hours
function calculateWorkingHours(intime, outTime) {
    let inTimeObj = dayjs(intime, "HH:mm");
    let outTimeObj = dayjs(outTime, "HH:mm");

    // If outTime is earlier than intime, it means it's on the next day
    if (outTimeObj.isBefore(inTimeObj)) {
        outTimeObj = outTimeObj.add(1, 'day');
    }

    let duration = outTimeObj.diff(inTimeObj, 'minutes'); // Get difference in minutes

    let hours = Math.floor(duration / 60).toString().padStart(2, '0'); // Ensure two-digit format
    let minutes = (duration % 60).toString().padStart(2, '0'); // Ensure two-digit format

    return `${hours}:${minutes}`;
}


async function moduleActivation(name, db) {
    let module = await db.query('select status from eve_acc_module_activation_master where name=:name', {
        replacements: {
            name: name,
        }, type: QueryTypes.SELECT
    })
    if (module[0]) {
        let res = Object.values(module[0])
        let newRes = res.toString()
        if (newRes == 'A') {
            newRes = 'yes'
        } else {
            newRes = 'no'
        }
        return newRes
    }
}


function addTimes(times) {
    let totalMinutes = 0;

    times.forEach(time => {
        if (typeof time !== 'string' || !time.includes(":")) return;

        const [hoursStr, minutesStr] = time.split(":");
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        if (isNaN(hours) || isNaN(minutes)) return;

        totalMinutes += hours * 60 + minutes;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}



function formatAmount(numericString) {

    if (numericString != null) {
        let numericValue = numericString
        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return formattedString
    }
}
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
}
const leaveType = async (leaveTypeId, db) => {

    let empleaveType = await db.query(`
                                      SELECT name,prefix,colorCode
                                      FROM eve_acc_leave_type 
                                      WHERE id=:id`,
        {

            replacements: {
                id: leaveTypeId
            },
            type: QueryTypes.SELECT
        })
    if (empleaveType[0]) {
        // let res = Object.values(empleaveType[0])
        // let newRes = res.toString()
        // return newRes
        return empleaveType[0]
    }
    else {
        return ''
    }
}
const getShiftIdByEmpId = async (employeeId, db) => {

    let empleaveType = await db.query(`
                                      SELECT 	shiftId
                                      FROM eve_hrm_employee_details 
                                      WHERE employeeId=:employeeId`,
        {

            replacements: {
                employeeId: employeeId
            },
            type: QueryTypes.SELECT
        })
    if (empleaveType[0]) {
        let res = Object.values(empleaveType[0])
        let newRes = res.toString()
        return newRes

    }
    else {
        return ''
    }
}
const getMonthlyAttendanceExcelSheet = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenbranchId = decodedToken.branchId
        const tokenCompanyId = decodedToken.companyId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // let db1 = sequelize('')


        // const tokenUserId = '29'
        // const tokenCompanyId = '59'
        // let db = sequelize(tokenCompanyId)

        let data = { ...req.body, ...req.query }
        let { month, year, subCompanyId, empCode, empName, branchId, deptId, designId, subDepartmentId, location, empType, category, userrole, api } = data
        let getData

        if (userrole === 'hr' || !userrole) {

            let countQuery = await db.query(`

                SELECT COUNT(*) AS total FROM eve_acc_employee AS emp
                 WHERE emp.status = 'A'
                 AND emp.employeeType='Blue Collar'
                 AND (
                     :empName IS NULL OR emp.employeeName=:empName
                     )
                 AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId = :subCompanyId) 
                 AND (:empCode IS NULL OR emp.employeeCode = :empCode) 
                 AND (:branchId IS NULL OR emp.employeeBranchId=:branchId)
                 AND (:deptId IS NULL OR emp.employeeDepartmentId = :deptId)
                 AND (:designId IS NULL OR emp.employeeDesignationId = :designId)
                 AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId = :subDepartmentId)
                 AND (:location IS NULL OR emp.locationID = :location)
                 AND (employeeCurrentStatus = '' 
                 OR employeeCurrentStatus IS NULL 
                 OR employeeCurrentStatus = 'Active'
                 OR employeeCurrentStatus = 'resignation' 
                 OR employeeCurrentStatus = 'joining'
                 OR employeeCurrentStatus = 'termination'
                 OR employeeCurrentStatus = 'release' 
                 OR employeeCurrentStatus = 'offerletter')
                 AND DATE_FORMAT(emp.employeeDoj, "%Y-%m") <= :yearMonth
                   AND (DATE_FORMAT(employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR employeeLastWorkingDate IS NULL )

                     AND (:empType IS NULL OR   emp.empTypeId=:empType)
                     AND (:category IS NULL OR   emp.employeeType=:category)
                 
                 `,
                {
                    replacements:
                    {
                        subCompanyId: subCompanyId || null,
                        empCode: empCode || null,
                        empName: empName || null,
                        branchId: branchId || null,
                        deptId: deptId || null,
                        designId: designId || null,
                        subDepartmentId: subDepartmentId || null,
                        location: location || null,
                        empType: empType || null,
                        category: category || null,
                        yearMonth: year + '-' + month


                    },
                    type: QueryTypes.SELECT
                }
            );
            totalData = countQuery[0].total;
            limit = parseInt(req.body.limit) || totalData;
            let maxPage = Math.ceil(totalData / limit)
            pageNo = parseInt(req.body.pageNo) || 1;
            pageNo = pageNo <= maxPage ? pageNo : maxPage
            let offset = (pageNo - 1) * limit;

            if (totalData == 0) {
                return res.status(200).send({ status: false, msg: "no data found", totalData: 0, employee: [] })
            }






            if (!(month && year)) {
                return res.status(400).send({ status: false, msg: 'enter year and month' })
            }


            getData = await db.query(`

                 

                
                     SELECT 
                        
                         emp.id AS empId,
                         emp.employeeName AS empName,
                         emp.employeeCode AS empCode,
                         emp.employeeBranchId AS branchName,
                         emp.employeeBranchId AS branchId,
                         emp.employeeSubCompanyId AS subCompanyName,
                         emp.employeeSubCompanyId AS subCompanyId,
                         emp.employeeDepartmentId AS departmentName,
                         emp.employeeDepartmentId AS deptId,
                         emp.employeeDesignationId AS designName,
                         emp.employeeDesignationId AS designId,
                         emp.employeeSubDepartmentId AS subDepartmentName,
                         emp.employeeSubDepartmentId AS subDepartmentId,
                         emp.locationID,
                         emp.employeeType AS category,
                         emp.empTypeId 
                     FROM
                         eve_acc_employee AS emp
                    
                  
                     WHERE
                         (emp.status = 'A')

                           AND emp.employeeType='Blue Collar'

                         AND (:empName IS NULL OR emp.employeeName = :empName)
                         AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId = :subCompanyId)
                         AND (:empCode IS NULL OR emp.employeeCode = :empCode)
                         AND (:branchId IS NULL OR emp.employeeBranchId = :branchId)
                         AND (:deptId IS NULL OR emp.employeeDepartmentId = :deptId)
                         AND (:designId IS NULL OR emp.employeeDesignationId = :designId)
                         AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId = :subDepartmentId)

                         AND (:location IS NULL OR emp.locationID = :location)

                         AND (
                             emp.employeeCurrentStatus = '' 
                             OR emp.employeeCurrentStatus IS NULL 
                             OR emp.employeeCurrentStatus = 'Active'
                             OR emp.employeeCurrentStatus = 'resignation' 
                             OR emp.employeeCurrentStatus = 'joining'
                             OR emp.employeeCurrentStatus = 'termination'
                             OR emp.employeeCurrentStatus = 'release' 
                             OR emp.employeeCurrentStatus = 'offerletter'
                         )
                         AND DATE_FORMAT(emp.employeeDoj, "%Y-%m") <= :yearMonth
                           AND (DATE_FORMAT(emp.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR emp.employeeLastWorkingDate IS NULL )

                            AND (:empType IS NULL OR   emp.empTypeId=:empType)
                     AND (:category IS NULL OR   emp.employeeType=:category)

                     ORDER BY emp.employeeName ASC
                     LIMIT :limit
                     OFFSET :offset
                

             `, {
                replacements: {
                    limit: limit,
                    offset: offset,
                    subCompanyId: subCompanyId || null,
                    empCode: empCode || null,
                    empName: empName || null,
                    branchId: branchId || null,
                    deptId: deptId || null,
                    designId: designId || null,
                    subDepartmentId: subDepartmentId || null,
                    location: location || null,
                    empType: empType || null,
                    category: category || null,
                    yearMonth: year + '-' + month
                },
                type: QueryTypes.SELECT
            });

            // getData = await db.query(`

            //       SELECT 
            //          slno, 
            //          empId, 
            //          empName, 
            //          empCode, 
            //          branchName, 
            //          branchId, 
            //          subCompanyName, 
            //          subCompanyId, 
            //          departmentName, 
            //          deptId, 
            //          designName, 
            //          designId, 
            //          subDepartmentName, 
            //          subDepartmentId, 
            //          location, 
            //          category, 
            //          locationName,
            //           empTypeId

            //      FROM (
            //          SELECT 
            //              @row_number:=@row_number + 1 AS slno,
            //              emp.id AS empId,
            //              emp.employeeName AS empName,
            //              emp.employeeCode AS empCode,
            //              emp.employeeBranchId AS branchName,
            //              emp.employeeBranchId AS branchId,
            //              emp.employeeSubCompanyId AS subCompanyName,
            //              emp.employeeSubCompanyId AS subCompanyId,
            //              emp.employeeDepartmentId AS departmentName,
            //              emp.employeeDepartmentId AS deptId,
            //              emp.employeeDesignationId AS designName,
            //              emp.employeeDesignationId AS designId,
            //              emp.employeeSubDepartmentId AS subDepartmentName,
            //              emp.employeeSubDepartmentId AS subDepartmentId,
            //              emp.locationID AS location,
            //              emp.employeeType AS category,
            //              eve_acc_locationmaster.location AS locationName,
            //              emp.empTypeId 
            //          FROM
            //              eve_acc_employee AS emp
            //          LEFT JOIN
            //              eve_acc_locationmaster ON emp.locationID = eve_acc_locationmaster.id
            //          CROSS JOIN
            //              (SELECT @row_number := :offset) AS init
            //          WHERE
            //              (emp.status = 'A')

            //                AND emp.employeeType='Blue Collar'

            //              AND (:empName IS NULL OR emp.employeeName = :empName)
            //              AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId = :subCompanyId)
            //              AND (:empCode IS NULL OR emp.employeeCode = :empCode)
            //              AND (:branchId IS NULL OR emp.employeeBranchId = :branchId)
            //              AND (:deptId IS NULL OR emp.employeeDepartmentId = :deptId)
            //              AND (:designId IS NULL OR emp.employeeDesignationId = :designId)
            //              AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId = :subDepartmentId)

            //              AND (:location IS NULL OR emp.locationID = :location)

            //              AND (
            //                  emp.employeeCurrentStatus = '' 
            //                  OR emp.employeeCurrentStatus IS NULL 
            //                  OR emp.employeeCurrentStatus = 'Active'
            //                  OR emp.employeeCurrentStatus = 'resignation' 
            //                  OR emp.employeeCurrentStatus = 'joining'
            //                  OR emp.employeeCurrentStatus = 'termination'
            //                  OR emp.employeeCurrentStatus = 'release' 
            //                  OR emp.employeeCurrentStatus = 'offerletter'
            //              )
            //              AND DATE_FORMAT(emp.employeeDoj, "%Y-%m") <= :yearMonth
            //                AND (DATE_FORMAT(emp.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR emp.employeeLastWorkingDate IS NULL )

            //                 AND (:empType IS NULL OR   emp.empTypeId=:empType)
            //          AND (:category IS NULL OR   emp.employeeType=:category)

            //          ORDER BY
            //              emp.employeeName
            //          LIMIT :limit
            //          OFFSET :offset
            //      ) AS sub
            //      ORDER BY slno

            //  `, {
            //     replacements: {
            //         limit: limit,
            //         offset: offset,
            //         subCompanyId: subCompanyId || null,
            //         empCode: empCode || null,
            //         empName: empName || null,
            //         branchId: branchId || null,
            //         deptId: deptId || null,
            //         designId: designId || null,
            //         subDepartmentId: subDepartmentId || null,
            //         location: location || null,
            //         empType: empType || null,
            //         category: category || null,
            //         yearMonth: year + '-' + month
            //     },
            //     type: QueryTypes.SELECT
            // });
        }
        else if (userrole === 'supervisor') {
            let countQuery = await db.query(`

                 SELECT COUNT(*) AS total 

                FROM eve_acc_employee AS a
                 RIGHT JOIN eve_acc_employee_attendance_reporting_system AS b ON a.id = b.empId
                 WHERE a.status = 'A'

                 AND a.employeeType='Blue Collar'

                 AND (
                     :empName IS NULL OR a.employeeName=:empName
                     )
                 AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId) 
                 AND (:empCode IS NULL OR a.employeeCode = :empCode) 
                 AND (:branchId IS NULL OR a.employeeBranchId=:branchId)
                 AND (:deptId IS NULL OR a.employeeDepartmentId = :deptId)
                 AND (:designId IS NULL OR a.employeeDesignationId = :designId)
                 AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId = :subDepartmentId)
                 AND (:location IS NULL OR a.locationID = :location)

                  AND (:empType IS NULL OR   a.empTypeId=:empType)

                   AND (:category IS NULL OR   a.employeeType=:category)

                 AND (a.employeeCurrentStatus = '' 
                 OR a.employeeCurrentStatus IS NULL 
                 OR a.employeeCurrentStatus = 'Active'
                 OR a.employeeCurrentStatus = 'resignation' 
                 OR a.employeeCurrentStatus = 'joining'
                 OR a.employeeCurrentStatus = 'termination'
                 OR a.employeeCurrentStatus = 'release' 
                 OR a.employeeCurrentStatus = 'offerletter')

                 AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth
                  AND (DATE_FORMAT(a.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR a.employeeLastWorkingDate IS NULL )

                   AND (
            b.appriserId = :userId 
            OR b.reviewerId = :userId 
            OR b.managerId = :userId
        )
                 
                 `,
                {
                    replacements:
                    {
                        subCompanyId: subCompanyId||null,
                        empCode: empCode||null,
                        empName: empName||null,
                        branchId: branchId||null,
                        deptId: deptId||null,
                        designId: designId||null,
                        subDepartmentId: subDepartmentId||null,
                        location: location||null,
                        empType: empType||null,
                        category: category||null,
                        yearMonth: year + '-' + month,
                        userId: tokenUserId,


                    },
                    type: QueryTypes.SELECT
                }
            );
            totalData = countQuery[0].total;
            limit = parseInt(req.body.limit) || totalData;
            let maxPage = Math.ceil(totalData / limit)
            pageNo = parseInt(req.body.pageNo) || 1;
            pageNo = pageNo <= maxPage ? pageNo : maxPage
            let offset = (pageNo - 1) * limit;

            if (totalData == 0) {
                return res.status(200).send({ status: false, msg: "no data found", totalData: 0, employee: [] })
            }






            if (!(month && year)) {
                return res.status(400).send({ status: false, msg: 'enter year and month' })
            }


            getData = await db.query(`
                   

                  
                        SELECT 
                            a.id AS empId,
                            a.employeeName AS empName,
                            a.employeeCode AS empCode,
                            a.employeeBranchId AS branchName,
                            a.employeeBranchId AS branchId,
                            a.employeeSubCompanyId AS subCompanyName,
                            a.employeeSubCompanyId AS subCompanyId,
                            a.employeeDepartmentId AS departmentName,
                            a.employeeDepartmentId AS deptId,
                            a.employeeDesignationId AS designName,
                            a.employeeDesignationId AS designId,
                            a.employeeSubDepartmentId AS subDepartmentName,
                            a.employeeSubDepartmentId AS subDepartmentId,
                            a.locationID ,
                            a.employeeType AS category,
                            
                            a.empTypeId 
                        FROM eve_acc_employee AS a
                        RIGHT JOIN eve_acc_employee_attendance_reporting_system AS b ON a.id = b.empId
                      
                        WHERE
                            a.status = 'A'

                               AND a.employeeType='Blue Collar'
                               
                            AND (:empName IS NULL OR a.employeeName = :empName)
                            AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
                            AND (:empCode IS NULL OR a.employeeCode = :empCode)
                            AND (:branchId IS NULL OR a.employeeBranchId = :branchId)
                            AND (:deptId IS NULL OR a.employeeDepartmentId = :deptId)
                            AND (:designId IS NULL OR a.employeeDesignationId = :designId)
                            AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId = :subDepartmentId)
                            AND (:location IS NULL OR a.locationID = :location)

                             AND (:empType IS NULL OR   a.empTypeId=:empType)

                               AND (:category IS NULL OR   a.employeeType=:category)

                            AND (
                                a.employeeCurrentStatus = '' 
                                OR a.employeeCurrentStatus IS NULL 
                                OR a.employeeCurrentStatus = 'Active'
                                OR a.employeeCurrentStatus = 'resignation' 
                                OR a.employeeCurrentStatus = 'joining'
                                OR a.employeeCurrentStatus = 'termination'
                                OR a.employeeCurrentStatus = 'release' 
                                OR a.employeeCurrentStatus = 'offerletter'
                            )
                            AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth
                          AND (DATE_FORMAT(a.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR a.employeeLastWorkingDate IS NULL )
                            AND (
                                b.appriserId = :userId 
                                OR b.reviewerId = :userId 
                                OR b.managerId = :userId
                            )
                        ORDER BY a.employeeName ASC
                  
                    LIMIT :limit OFFSET :offset
                `, {
                replacements: {
                    limit: limit,
                    offset: offset,
                     subCompanyId: subCompanyId||null,
                        empCode: empCode||null,
                        empName: empName||null,
                        branchId: branchId||null,
                        deptId: deptId||null,
                        designId: designId||null,
                        subDepartmentId: subDepartmentId||null,
                        location: location||null,
                        empType: empType||null,
                        category: category||null,
                        yearMonth: year + '-' + month,
                        userId: tokenUserId,
                    
                },
                type: QueryTypes.SELECT
            });
        }
        let totalWork
        let totalActualShift = []
        let timeArr = []
        let shiftArr = []
        let totalIdleWagesDays = 0
        let totalPresent = 0
        let totalHalfDay = 0
        let totalAbsent = 0
        let totalPaidLeave = 0
        let totalUnpaidLeave = 0

        let startDate = `${year}-${month}-01`
        let endDate = moment(startDate).endOf('month').format('YYYY-MM-DD')



        await Promise.all(getData.map(async (e) => {
            let totalWorkIn
            e.branchName = await myFunc.getBranchNameByBranchId(e.branchName, db)
            e.subCompanyName = await myFunc.getSubCompanyNameById(e.subCompanyName, db)
            e.departmentName = await myFunc.departmentNameByDepartmentId(e.departmentName, db)
            e.designName = await myFunc.getDesignationNameById(e.designName, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.subDepartmentName, db)
            e.type = await myFunc.getEmpTypeName(e.empTypeId, db)
            e.shiftId = await getShiftIdByEmpId(e.empId, db)
            e.locationName = await myFunc.getLocationNameById(e.locationID, db)
            // e.actualShiftHours = ''
            const empRoasterModel = await db.query(
                `
                SELECT
                a.shiftId,
                b.clockInTime,
                b.clockOutTime,
                b.minWorkingHour,
                b.minWorkingHourMin

                FROM eve_hrm_employee_roaster AS a
                LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id 
                WHERE a.status='A'
                AND employeeId=:empId

            

                -- AND DATE_FORMAT(a.fromDate,'%d-%m-%Y') <= :date
                -- AND DATE_FORMAT(a.toDate,'%d-%m-%Y') >= :date 

                 AND YEAR(fromDate)=:year
                 AND MONTH(fromDate)=:month
            
    
                `,
                {
                    replacements: {
                        empId: e.empId,
                        year: year,
                        month: month,
                    },
                    type: QueryTypes.SELECT
                }
            )




            if (empRoasterModel.length > 0 && empRoasterModel[0]['minWorkingHour'] !== null && empRoasterModel[0]['minWorkingHourMin'] !== null) {
                e.actualShiftHours = `${(empRoasterModel[0]['minWorkingHour'])}:${(empRoasterModel[0]['minWorkingHourMin'])}`
                shiftArr.push(e.actualShiftHours)
            }
            else {
                const empShiftModel = await db.query(
                    `
                    SELECT a.shiftId,b.minWorkingHour,b.minWorkingHourMin 
                    FROM eve_hrm_employee_details AS a
                    LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id  
                    WHERE a.status='A'
                    AND employeeId=:empId 
                    `, {
                    replacements: {
                        empId: e.empId

                    }, type: QueryTypes.SELECT
                }
                )


                if (empShiftModel.length > 0 && empShiftModel[0]['minWorkingHour'] !== null && empShiftModel[0]['minWorkingHourMin'] !== null) {

                    e.actualShiftHours = `${(empShiftModel[0]['minWorkingHour'])}:${(empShiftModel[0]['minWorkingHourMin'])}`
                    shiftArr.push(e.actualShiftHours)
                }
                else {
                    e.actualShiftHours = ''
                }
            }
            totalActualShift = myFunc.addTimes(shiftArr)
            e.compOff = []
            e.holidayArr = []
            e.fixedWeeklyOffDay = await myFunc.getFixWeeklyOffDay(e.empId, e.branchId, db)
            e.additionalWeeklyOffDay = await myFunc.additionalWeeklyOffDay(e.branchId, year, month, db)

            function getDaysInMonth(year, month) {
                return new Date(year, month, 0).getDate();
            }

            const daysInCurrentMonth = getDaysInMonth(year, month);

            let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

            const appDetailsObj = [];

            for (let i = 1; i <= NoOfdaysInMonth; i++) {
                let number = i.toString().padStart(2, '0');
                let newObj = {
                    crtDate: `${year}-${month}-${number}`,
                    dayName: moment(`${year}-${month}-${number}`, "YYYY-MM-DD").format('dddd'),
                    intime: "--",
                    outTime: "--",
                    workingHour: "--",
                    attStatus: "--",
                    title: "--",
                    idleWageStatus: '--',
                    lateAttendanceForLToolTip: '',
                    lateAttendanceForLValue: '',
                    shiftName: '',
                    lateTimeEnd: '',
                    shiftId: '',
                };


                appDetailsObj.push(newObj);
            }
            e.appDetails = appDetailsObj;

            const attendanceData = await db.query(
                `    SELECT intime,outTime,date FROM eve_acc_employee_attendence 
                     WHERE empId=:empId 
                     AND status='A'
                     AND DATE_FORMAT(date, '%Y-%m') = :yearMonth

        `, {
                replacements: {
                    empId: e.empId,
                    yearMonth: year + '-' + month
                },
                type: QueryTypes.SELECT
            }
            )
           
            
            let attendanceMap = new Map();
            attendanceData.map(x => attendanceMap.set(x.date, x))



            const targetObjOfApproved = await db.query(
                `SELECT * FROM eve_acc_employee_attendence_approved 
                         WHERE employeeId=:empId 
                         AND status='A'
                          AND DATE_FORMAT(date, '%Y-%m') = :yearMonth
                        
            `, {
                replacements: {
                    empId: e.empId,
                    yearMonth: year + '-' + month

                },
                type: QueryTypes.SELECT
            }
            )
          
            
            let approvedMap = new Map();
            targetObjOfApproved.map(x => approvedMap.set(x.date, x))
            e.idleWageStatusCount = 0
            e.totalFullDay = 0
            e.totalHalfDay = 0
            e.totalReject = 0
            e.totalPresentDay = 0
            e.totalAbsent = 0
            e.totalPaidLeave = 0
            e.totalUnpaidLeave = 0
            e.totalPaidHoliday = 0
            e.totalAdditionalWeeklyOffDay = 0
            e.totalFixedWeeklyOffDay = 0
            e.totalCompanyHoliday = 0

            let timeArrIn = []


            let shiftListByRoaster = await db.query(`
        SELECT a.shiftId,b.name,a.fromDate,a.toDate,b.lateTimeEnd 
        FROM eve_hrm_employee_roaster AS a
        LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id
        WHERE a.status = 'A' AND employeeId = :empId 
        AND a.fromDate >= :startDate AND a.toDate <= :endDate
    `, {
                replacements: {
                    empId: e.empId,
                    startDate: startDate,
                    endDate: endDate,
                },
                type: QueryTypes.SELECT
            });
            let shiftRoasterMap = new Map();

            shiftListByRoaster.forEach(shift => {
                const datesInRange = getDateRange(shift.fromDate, shift.toDate);
                datesInRange.forEach(date => {
                    shiftRoasterMap.set(date, shift);
                });
            });

            let shiftList = await db.query(`
        SELECT name,lateTimeEnd 
        FROM eve_hrm_employee_shift_master
        WHERE status = 'A' AND id = :shiftId 
       
    `, {
                replacements: {
                    shiftId: e.shiftId,
                },
                type: QueryTypes.SELECT
            });
           
            await Promise.all(e.appDetails.map(async x => {
                  if (attendanceMap.has(x.crtDate)) {
                    let attendanceRecord = attendanceMap.get(x.crtDate);
                    x.intime = attendanceRecord.intime ? attendanceRecord.intime : '--';
                    x.outTime = attendanceRecord.outTime ? attendanceRecord.outTime : '--';
                    if (x.intime && x.outTime != ":" && x.outTime && x.outTime != "--") {
                        x.workingHour = calculateWorkingHours(x.intime, x.outTime)
                        timeArr.push(x.workingHour)
                        totalWork = myFunc.addTimes(timeArr)
                        // totalWorkIn = myFunc.addTimes(timeArr)
                        timeArrIn.push(x.workingHour)

                    }
                }

                if (shiftRoasterMap.has(x.crtDate)) {
                    let shiftRecord = shiftRoasterMap.get(x.crtDate);
                    x.shiftName = shiftRecord.shiftId === '0' ? 'Off Day' : (shiftRecord.name || '');
                    x.shiftId = shiftRecord.shiftId ? shiftRecord.shiftId : '';
                    x.lateTimeEnd = shiftRecord.lateTimeEnd ? shiftRecord.lateTimeEnd : '';


                    if (
                        x.intime && x.lateTimeEnd &&
                        moment(x.intime, 'HH:mm', true).isValid() &&
                        moment(x.lateTimeEnd, 'HH:mm', true).isValid() &&
                        moment(x.intime, 'HH:mm').isAfter(moment(x.lateTimeEnd, 'HH:mm'))
                    ) {
                        x.lateAttendanceForLToolTip = 'Late Punch In';
                        x.lateAttendanceForLValue = 'L';
                    }

                }

                else if (shiftList.length > 0) {
                    x.shiftName = shiftList[0].name ? shiftList[0].name : '';
                    x.lateTimeEnd = shiftList[0].lateTimeEnd ? shiftList[0].lateTimeEnd : '';
                  
                    if (
                        x.intime && x.lateTimeEnd &&
                        moment(x.intime, 'HH:mm', true).isValid() &&
                        moment(x.lateTimeEnd, 'HH:mm', true).isValid() &&
                        moment(x.intime, 'HH:mm').isAfter(moment(x.lateTimeEnd, 'HH:mm'))
                    ) {
                        x.lateAttendanceForLToolTip = 'Late Punch In';
                        x.lateAttendanceForLValue = 'L';
                    }


                }




              
                if (approvedMap.has(x.crtDate)) {
                    let approvedRecord = approvedMap.get(x.crtDate);
                    x.idleWageStatus = approvedRecord.idleWageStatus ? approvedRecord.idleWageStatus : '--';
                    if (approvedRecord.idleWageStatus === 'yes') {
                        e.idleWageStatusCount++
                        totalIdleWagesDays++
                    }
                    if (approvedRecord.type == "full") {

                        x.title = "Present";
                        x.attStatus = "Fullday"
                        e.totalFullDay++
                        e.totalPresentDay++

                    }
                    else if (approvedRecord.type == "reject" && approvedRecord.remarks != "AB LEAVE" && approvedRecord.remarks != "First Half" && approvedRecord.remark != "Second Half") {
                        x.attStatus = "Absent"
                        x.title = "Absent";
                        e.totalReject++
                        e.totalAbsent++

                    }

                    else if (approvedRecord.type == "half") {
                        x.attStatus = "Halfday"
                        x.backcolor = "#b1b82c"
                        x.title = "Halfday";
                        e.totalHalfDay++
                    }

                    else if (approvedRecord.leaveTypeId && approvedRecord.type == 'holiday' && approvedRecord.remarks == 'L LEAVE' && approvedRecord.leaveTypeId != '') {
                        let leaveResult = await myFunc.leaveType(approvedRecord.leaveTypeId, db)

                        x.title = leaveResult.name
                        x.attStatus = leaveResult.prefix
                        e.totalPaidLeave++
                        if (approvedRecord.flagRemarks == "ForLateClockIn") {
                            x.title = " For Late ClockIn";
                            x.lateClockIn = "Leave Deducted For Late ClockIn"
                        }

                    }

                    else if (approvedRecord.type == "holiday" && approvedRecord.remarks == "L LEAVE" && approvedRecord.leaveTypeId == '') {
                        x.attStatus = "D-PL"
                        x.title = "Default Paid Leave";
                        e.totalPaidLeave++
                    }

                    else if (approvedRecord.type == "reject" && approvedRecord.remarks == "AB LEAVE") {
                        x.attStatus = "UL"
                        x.title = "Unpaid Leave";
                        e.totalUnpaidLeave++
                    }

                    else if (approvedRecord.type == 'holiday' && approvedRecord.remarks == 'First Half' || approvedRecord.remarks == 'Second Half') {
                        x.attStatus = 'HD-PL'
                        x.backcolor = '#ffa742'
                        x.title = 'Halfday Paid Leave';
                        e.totalHalfdayPaidLeave++;
                    }

                    else if (approvedRecord.type == 'reject' && approvedRecord.remarks == 'First Half' || approvedRecord.remarks == 'Second Half') {
                        x.attStatus = 'HD-UL'
                        x.backcolor = '#b0f320'
                        x.title = 'Halfday unpaid Leave';
                        e.totalHalfdayunpaidLeave++;
                    }


                    else if (approvedRecord.type == 'holiday' && approvedRecord.remarks != 'L LEAVE' && approvedRecord.remarks != 'First Half' && approvedRecord.remarks != 'Second Half') {
                        x.attStatus = 'Marked as Holiday'
                        x.backcolor = '#ccffcc'
                        x.title = 'Marked as Holiday';
                        e.totalMarkedAsHoliday++
                    }

                    else if (approvedRecord.type == "sunday reject") {
                        x.attStatus = "Absent"
                        x.backcolor = "#f1bcbc"
                        x.title = "Absent";
                        e.totalReject++
                        e.totalAbsent++
                    }

                }
                else {

                    x.attStatus = "-";
                    x.title = "";


                    let companyHoliday = await myFunc.checkSetHolidayDate(e.branchId, x.crtDate, db)
                    if (companyHoliday === 'yes') {

                        e.totalCompanyHoliday++
                        x.attStatus = "company holiday"
                        e.totalPaidHoliday++
                    }

                    else if (x.dayName === e.fixedWeeklyOffDay) {
                        e.totalFixedWeeklyOffDay++
                        x.attStatus = "Off Day"
                        e.totalPaidHoliday++
                    }
                    else if (e.additionalWeeklyOffDay.includes(x.crtDate)) {
                        e.totalAdditionalWeeklyOffDay++
                        x.attStatus = "Off Day"
                        e.totalPaidHoliday++
                    }

                }



            }))
            e.totalWorkingHours = myFunc.addTimes(timeArrIn)
            timeArr.push(e.totalWorkingHour)
            totalPresent += parseInt(e.totalFullDay)
            totalHalfDay += parseInt(e.totalHalfDay)
            totalAbsent += parseInt(e.totalAbsent)
            totalPaidLeave += parseInt(e.totalPaidLeave)
            totalUnpaidLeave += parseInt(e.totalUnpaidLeave)



        }))
        totalActualShift = myFunc.addTimes(shiftArr)
        totalWork = addTimes(timeArr)

        if (api === 'raw') {

            return res.status(200).json({
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,

                // totalSalaryExpenses: totalSalaryExpenses,
                totalWork: totalWork,
                totalActualShift: totalActualShift,
                totalPresent: totalPresent,
                totalHalfDay: totalHalfDay,
                totalAbsent: totalAbsent,
                totalPaidLeave: totalPaidLeave,
                totalUnpaidLeave: totalUnpaidLeave,
                totalIdleWagesDays: totalIdleWagesDays,
                employee: getData,
            })
        }

        let attendanceReportExcel = getData.map((e, i) => ({
            'Sl. No.': Number(i + 1),
            'Worker Name': e.empName,
            'Worker Code': e.empCode,
            'Category': e.category,
            'Type': e.type,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Location': e.locationName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designName,
            'App': e.appDetails,
            'Total Work Hours': e.totalWorkingHours,
            'Actual Shift Hours': e.actualShiftHours,
            // 'Status': e.status,
            'Present': e.totalPresentDay,
            'Half Day': e.totalHalfDay,
            'Absent': e.totalAbsent,
            'Total Idle Wage Days': e.idleWageStatusCount,
            'Paid Leave': e.totalPaidLeave,
            'Unpaid Leave': e.totalUnpaidLeave,
        }))
        if (api === 'excel') {
            return res.status(200).json({
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,

                // totalSalaryExpenses: totalSalaryExpenses,
                totalWork: totalWork,
                totalActualShift: totalActualShift,
                totalPresent: totalPresent,
                totalHalfDay: totalHalfDay,
                totalAbsent: totalAbsent,
                totalPaidLeave: totalPaidLeave,
                totalUnpaidLeave: totalUnpaidLeave,
                totalIdleWagesDays: totalIdleWagesDays,
                employee: attendanceReportExcel,
            })
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
        let values = []
        let employee = myFunc.replaceEmptyValues(attendanceReportExcel)
        let header = Object.keys(employee[0])
        let subHeader = []
        let midHeader = []

        let appIndex = header.indexOf('App')

        let mergeColumn = []

        employee[0].App.forEach((e, i) => {
            midHeader.push(e.crtDate, '', '', '', '', '')
            subHeader.push('In Time', 'Out Time', 'Working hr.', 'Status', 'Shift/Roster Name', 'Late Mark')

            let startColumn = (appIndex + 1) + (i * 6)
            let endColumn = (startColumn + 5)
            let endRow = 1
            let startRow = 1
            mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
            // worksheet.mergeCells(`${getColumnLetter(startColumn)}2:${getColumnLetter(endColumn)}2`)
        })

        header.splice(appIndex, 1, ...midHeader)

        subHeader.unshift(...new Array(appIndex).fill(''))


        values.push(header)
        values.push(subHeader)

        employee.forEach(e => {
            let value = Object.values(e)
            let row = []
            value.forEach((x, i) => {
                if (Array.isArray(x)) {
                    x.forEach((z, k) => {
                        row.push(z.intime, z.outTime, z.workingHour, z.attStatus, z.shiftName, z.lateAttendanceForLValue)
                    })
                }
                else {
                    row.push(x)
                }
            })


            values.push(row)


        });

        // Assuming 'header' is defined and contains the correct headers

        // Get indices for the required columns
        let totalWorkIndex = header.indexOf('Total Work Hours') + 1; // Add 1 because ExcelJS uses 1-based index
        let totalActualIndex = header.indexOf('Actual Shift Hours') + 1;
        let totalPresentIndex = header.indexOf('Present') + 1;
        let totalHalfDayIndex = header.indexOf('Half Day') + 1;
        let totalAbsentIndex = header.indexOf('Absent') + 1;
        let totalPaidLeaveIndex = header.indexOf('Paid Leave') + 1;
        let totalUnpaidLeaveIndex = header.indexOf('Unpaid Leave') + 1;
        // let status = header.indexOf('Status') + 1;
        let total = header.indexOf('Sl. No.') + 1; // Adjusted as ExcelJS is 1-based
        let totalIdleWagesDaysIndex = header.indexOf('Total Idle Wage Days') + 1; // Adjusted as ExcelJS is 1-based

        // Log indices for debugging


        // Prepare data row with appropriate length
        let len = header.length;
        let row = new Array(len).fill('');

        // Assign data values to their respective indices
        row[totalWorkIndex - 1] = totalWork // Use 0-based for array
        row[totalActualIndex - 1] = totalActualShift
        row[totalPresentIndex - 1] = totalPresent
        row[totalHalfDayIndex - 1] = totalHalfDay
        row[totalAbsentIndex - 1] = totalAbsent
        row[totalPaidLeaveIndex - 1] = totalPaidLeave
        row[totalUnpaidLeaveIndex - 1] = totalUnpaidLeave
        row[totalIdleWagesDaysIndex - 1] = totalIdleWagesDays
        row[total - 1] = 'TOTAL';

        // Push the row into values array
        values.push(row);

        // Add the values to the worksheet
        worksheet.addRows(values);

        // Merge cells as required
        mergeColumn.forEach((e) => {
            worksheet.mergeCells(e);
        });

        // Setting cell values using calculated indices
        // worksheet.getCell(2, totalWorkIndex).value = '';
        // worksheet.getCell(2, totalActualIndex).value = '';
        // worksheet.getCell(2, totalPresent).value = '';
        // worksheet.getCell(2, totalHalfDay).value = '';
        // worksheet.getCell(2, totalAbsent).value = '';
        // worksheet.getCell(2, totalPaidLeave).value = '';
        // worksheet.getCell(2, totalUnpaidLeave).value = '';
        // worksheet.getCell(2, status).value = '';
        // worksheet.getCell(2, totalIdleWagesDays).value = '';


        const headerRow = worksheet.getRow(1);
        const headerRow2 = worksheet.getRow(2);

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                row.height = 25

            });
        });
        headerRow.eachCell(cell => {
            // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
            cell.font = { bold: true };

        });
        headerRow2.eachCell(cell => {
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

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Monthly Attendance.xlsx');

        await workbook.xlsx.write(res);
        res.end();


    } catch (error) {

        return res.status(400).json({ status: 'error', message: error.message, err: error.stack })
    }
}





async function checkSetHolidayDate(date, db) {
    const sql = await db.query(
        `
        select * from eve_acc_company_holiday
        where status='A'
        and branchId=:branchId
        and date=:date
        `, {
        replacements: {
            branchId: tokenBranchId,
            date: date,
        }, type: QueryTypes.SELECT
    }
    )
    // console.log(sql);

    if (sql[0]) {
        return 'yes'
    }
    else {
        return 'no'
    }
}

const getShiftName = async (empId, date = "", db, shiftMasterCache = new Map()) => {
    // 1. Check roaster for the specific date
    const roasterList = await db.query(`
    SELECT * FROM eve_hrm_employee_roaster
    WHERE status = 'A' AND employeeId = :empId
    AND fromDate <= :date AND toDate >= :date
    LIMIT 1
  `, {
        replacements: { empId, date },
        type: QueryTypes.SELECT
    });

    if (roasterList[0]) {
        const shiftId = roasterList[0].shiftId;
        if (shiftId === 0) return "Off Day";

        // Use cached shift master if available
        if (shiftMasterCache.has(shiftId)) {
            return shiftMasterCache.get(shiftId);
        }

        const shiftDetails = await db.query(`
      SELECT * FROM eve_hrm_employee_shift_master
      WHERE id = :shiftId AND status = 'A'
      LIMIT 1
    `, {
            replacements: { shiftId },
            type: QueryTypes.SELECT
        });

        if (shiftDetails[0]) {
            shiftMasterCache.set(shiftId, shiftDetails[0].name);
            return shiftDetails[0].name;
        }
    }

    // 2. Check customized shift fallback
    const customShift = await db.query(`
    SELECT * FROM eve_hrm_employee_shift_customize
    WHERE status = 'A' AND employeeId = :empId
    ORDER BY id DESC
    LIMIT 1
  `, {
        replacements: { empId },
        type: QueryTypes.SELECT
    });

    if (customShift[0]) return customShift[0].name;

    // 3. Fallback to employee default shift
    const employee = await db.query(`
    SELECT * FROM eve_hrm_employee_details
    WHERE status = 'A' AND employeeId = :empId
    LIMIT 1
  `, {
        replacements: { empId },
        type: QueryTypes.SELECT
    });

    if (employee[0]) {
        const shiftId = employee[0].shiftId;

        if (shiftMasterCache.has(shiftId)) {
            return shiftMasterCache.get(shiftId);
        }

        const shift = await db.query(`
      SELECT * FROM eve_hrm_employee_shift_master
      WHERE id = :shiftId AND status = 'A'
      LIMIT 1
    `, {
            replacements: { shiftId },
            type: QueryTypes.SELECT
        });

        if (shift[0]) {
            shiftMasterCache.set(shiftId, shift[0].name);
            return shift[0].name;
        }
    }

    // 4. Final fallback
    return "";
};

function getColumnLetter(columnNumber) {
    let columnName = '';
    while (columnNumber > 0) {
        let remainder = (columnNumber - 1) % 26;
        columnName = String.fromCharCode(65 + remainder) + columnName;
        columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnName;
}

module.exports = { getMonthlyAttendanceExcelSheet }




// let sequelize = require("../config/db")
// const { QueryTypes } = require('sequelize')
// const moment = require('moment')
// const axios = require('axios')
// const ExcelJS = require('exceljs')
// const myFunc = require('../functions/functions')
// const dayjs = require('dayjs');

// // Function to calculate working hours
// function calculateWorkingHours(intime, outTime) {
//     let inTimeObj = dayjs(intime, "HH:mm");
//     let outTimeObj = dayjs(outTime, "HH:mm");

//     // If outTime is earlier than intime, it means it's on the next day
//     if (outTimeObj.isBefore(inTimeObj)) {
//         outTimeObj = outTimeObj.add(1, 'day');
//     }

//     let duration = outTimeObj.diff(inTimeObj, 'minutes'); // Get difference in minutes

//     let hours = Math.floor(duration / 60).toString().padStart(2, '0'); // Ensure two-digit format
//     let minutes = (duration % 60).toString().padStart(2, '0'); // Ensure two-digit format

//     return `${hours}:${minutes}`;
// }


// async function moduleActivation(name, db) {
//     let module = await db.query('select status from eve_acc_module_activation_master where name=:name', {
//         replacements: {
//             name: name,
//         }, type: QueryTypes.SELECT
//     })
//     if (module[0]) {
//         let res = Object.values(module[0])
//         let newRes = res.toString()
//         if (newRes == 'A') {
//             newRes = 'yes'
//         } else {
//             newRes = 'no'
//         }
//         return newRes
//     }
// }

// function addTimes(times) {
//     let totalMinutes = 0;

//     // Convert each time to minutes and add to the total
//     times.forEach(time => {
//         const timeMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
//         totalMinutes += timeMinutes;
//     });

//     // Convert the total minutes back to hours and minutes
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;

//     // Format the result
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
// }



// function formatAmount(numericString) {

//     if (numericString != null) {
//         let numericValue = numericString
//         let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
//         return formattedString
//     }
// }
// const departmentNameByDepartmentId = async (id, db) => {
//     let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subDepartment[0]) {
//         let res = Object.values(subDepartment[0])
//         let newRes = res.toString()
//         return newRes
//     }
// }
// const getEmployeeNameById = async (id, db) => {
//     let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })

//     if (employeeName[0]) {

//         let res = Object.values(employeeName[0])
//         let newRes = (res.toString());
//         return newRes
//     }
// }


// const getBranchNameByBranchId = async (id, db) => {
//     let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {
//         replacements: {
//             branchId: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (branchName[0]) {

//         let res = Object.values(branchName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }
// const getDesignationNameById = async (id, db) => {
//     let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     }
//     )

//     if (designationName[0]) {
//         let res = Object.values(designationName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }

// const getSubCompanyNameById = async (id, db) => {
//     let subCompanyName = await db.query('select companyName from eve_acc_subCompany where id=:id && status="A"', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subCompanyName[0]) {
//         let res = Object.values(subCompanyName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }
// const getSubDepartmentNameBySubDepartmentId = async (id, db) => {
//     let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subDepartment[0]) {
//         let res = Object.values(subDepartment[0])
//         let newRes = res.toString()
//         return newRes
//     }
// }
// const leaveType = async (leaveTypeId, db) => {

//     let empleaveType = await db.query(`
//                                       SELECT name,prefix,colorCode
//                                       FROM eve_acc_leave_type 
//                                       WHERE id=:id`,
//         {

//             replacements: {
//                 id: leaveTypeId
//             },
//             type: QueryTypes.SELECT
//         })
//     if (empleaveType[0]) {
//         // let res = Object.values(empleaveType[0])
//         // let newRes = res.toString()
//         // return newRes
//         return empleaveType[0]
//     }
//     else {
//         return ''
//     }
// }

// const getMonthlyAttendanceExcel = async (req, res) => {

//     try {
//         // const decodedToken = req.headerSession
//         // const tokenUserId = decodedToken.userId
//         // const tokenbranchId = decodedToken.branchId
//         // const tokenCompanyId = decodedToken.companyId
//         // const tokenMainUserId = decodedToken.mainUserId
//         // let db = sequelize(tokenCompanyId)
//         let db1 = sequelize('')


//         const tokenUserId = '29'
//         const tokenCompanyId = '59'
//         let db = sequelize(tokenCompanyId)

//         let data = req.body
//         let { month, year } = data

//         // let compensatoryOffAct
//         // const compensatoryOffLeaveAct = await moduleActivation('compensatory_off_leave', db)
//         // const compensatoryOffPaidAct = await moduleActivation('compensatory_off_paid', db)
//         // if (compensatoryOffLeaveAct == 'yes' || compensatoryOffPaidAct == 'yes') {
//         //     compensatoryOffAct = 'yes'
//         // }
//         // else {
//         //     compensatoryOffAct = 'no'
//         // }


//         let subCompanyId = (req.body.subCompanyId || null)
//         let empCode = (req.body.empCode || null)
//         let empName = (req.body.empName || null)
//         let branchId = (req.body.branchId || null)
//         let deptId = (req.body.deptId || null)
//         let designId = (req.body.designId || null)
//         let subDepartmentId = (req.body.subDepartmentId || null)
//         let location = (req.body.location || null)
//         let empType = (req.body.empType || null)
//         let category = (req.body.category || null)
//         let userrole = req.body.userrole

//         // if (!userrole) {
//         //     return res.status(400).json({ status: false, msg: 'plz enter userrole' })
//         // }

//         if (userrole === 'hr' || !userrole) {

//             let countQuery = await db.query(`

//                 SELECT COUNT(*) AS total FROM eve_acc_employee AS emp
//                  WHERE emp.status = 'A'
//                  AND emp.employeeType='Blue Collar'
//                  AND (
//                      :empName IS NULL OR emp.employeeName=:empName
//                      )
//                  AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId = :subCompanyId) 
//                  AND (:empCode IS NULL OR emp.employeeCode = :empCode) 
//                  AND (:branchId IS NULL OR emp.employeeBranchId=:branchId)
//                  AND (:deptId IS NULL OR emp.employeeDepartmentId = :deptId)
//                  AND (:designId IS NULL OR emp.employeeDesignationId = :designId)
//                  AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId = :subDepartmentId)
//                  AND (:location IS NULL OR emp.locationID = :location)
//                  AND (employeeCurrentStatus = '' 
//                  OR employeeCurrentStatus IS NULL 
//                  OR employeeCurrentStatus = 'Active'
//                  OR employeeCurrentStatus = 'resignation' 
//                  OR employeeCurrentStatus = 'joining'
//                  OR employeeCurrentStatus = 'termination'
//                  OR employeeCurrentStatus = 'release' 
//                  OR employeeCurrentStatus = 'offerletter')
//                  AND DATE_FORMAT(emp.employeeDoj, "%Y-%m") <= :yearMonth
//                    AND (DATE_FORMAT(employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR employeeLastWorkingDate IS NULL )

//                      AND (:empType IS NULL OR   emp.empTypeId=:empType)
//                      AND (:category IS NULL OR   emp.employeeType=:category)
                 
//                  `,
//                 {
//                     replacements:
//                     {
//                         subCompanyId: subCompanyId,
//                         empCode: empCode,
//                         empName: empName,
//                         branchId: branchId,
//                         deptId: deptId,
//                         designId: designId,
//                         subDepartmentId: subDepartmentId,
//                         location: location,
//                         empType: empType,
//                         category: category,
//                         yearMonth: year + '-' + month


//                     },
//                     type: QueryTypes.SELECT
//                 }
//             );
//             totalData = countQuery[0].total;
//             limit = parseInt(req.body.limit) || totalData;
//             let maxPage = Math.ceil(totalData / limit)
//             pageNo = parseInt(req.body.pageNo) || 1;
//             pageNo = pageNo <= maxPage ? pageNo : maxPage
//             let offset = (pageNo - 1) * limit;

//             if (totalData == 0) {
//                 return res.status(200).send({ status: false, msg: "no data found", totalData: 0, employee: [] })
//             }






//             if (!(month && year)) {
//                 return res.status(400).send({ status: false, msg: 'enter year and month' })
//             }


//             getData = await db.query(`

//                   SELECT 
//                      slno, 
//                      empId, 
//                      empName, 
//                      empCode, 
//                      branchName, 
//                      branchId, 
//                      subCompanyName, 
//                      subCompanyId, 
//                      departmentName, 
//                      deptId, 
//                      designName, 
//                      designId, 
//                      subDepartmentName, 
//                      subDepartmentId, 
//                      location, 
//                      category, 
//                      locationName,
//                       empTypeId

//                  FROM (
//                      SELECT 
//                          @row_number:=@row_number + 1 AS slno,
//                          emp.id AS empId,
//                          emp.employeeName AS empName,
//                          emp.employeeCode AS empCode,
//                          emp.employeeBranchId AS branchName,
//                          emp.employeeBranchId AS branchId,
//                          emp.employeeSubCompanyId AS subCompanyName,
//                          emp.employeeSubCompanyId AS subCompanyId,
//                          emp.employeeDepartmentId AS departmentName,
//                          emp.employeeDepartmentId AS deptId,
//                          emp.employeeDesignationId AS designName,
//                          emp.employeeDesignationId AS designId,
//                          emp.employeeSubDepartmentId AS subDepartmentName,
//                          emp.employeeSubDepartmentId AS subDepartmentId,
//                          emp.locationID AS location,
//                          emp.employeeType AS category,
//                          eve_acc_locationmaster.location AS locationName,
//                          emp.empTypeId 
//                      FROM
//                          eve_acc_employee AS emp
//                      LEFT JOIN
//                          eve_acc_locationmaster ON emp.locationID = eve_acc_locationmaster.id
//                      CROSS JOIN
//                          (SELECT @row_number := :offset) AS init
//                      WHERE
//                          (emp.status = 'A')

//                            AND emp.employeeType='Blue Collar'

//                          AND (:empName IS NULL OR emp.employeeName = :empName)
//                          AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId = :subCompanyId)
//                          AND (:empCode IS NULL OR emp.employeeCode = :empCode)
//                          AND (:branchId IS NULL OR emp.employeeBranchId = :branchId)
//                          AND (:deptId IS NULL OR emp.employeeDepartmentId = :deptId)
//                          AND (:designId IS NULL OR emp.employeeDesignationId = :designId)
//                          AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId = :subDepartmentId)

//                          AND (:location IS NULL OR emp.locationID = :location)

//                          AND (
//                              emp.employeeCurrentStatus = '' 
//                              OR emp.employeeCurrentStatus IS NULL 
//                              OR emp.employeeCurrentStatus = 'Active'
//                              OR emp.employeeCurrentStatus = 'resignation' 
//                              OR emp.employeeCurrentStatus = 'joining'
//                              OR emp.employeeCurrentStatus = 'termination'
//                              OR emp.employeeCurrentStatus = 'release' 
//                              OR emp.employeeCurrentStatus = 'offerletter'
//                          )
//                          AND DATE_FORMAT(emp.employeeDoj, "%Y-%m") <= :yearMonth
//                            AND (DATE_FORMAT(emp.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR emp.employeeLastWorkingDate IS NULL )

//                             AND (:empType IS NULL OR   emp.empTypeId=:empType)
//                      AND (:category IS NULL OR   emp.employeeType=:category)

//                      ORDER BY
//                          emp.employeeName
//                      LIMIT :limit
//                      OFFSET :offset
//                  ) AS sub
//                  ORDER BY slno

//              `, {
//                 replacements: {
//                     limit: limit,
//                     offset: offset,
//                     subCompanyId: subCompanyId,
//                     empCode: empCode,
//                     empName: empName,
//                     branchId: branchId,
//                     deptId: deptId,
//                     designId: designId,
//                     subDepartmentId: subDepartmentId,
//                     location: location,
//                     empType: empType,
//                     category: category,
//                     yearMonth: year + '-' + month
//                 },
//                 type: QueryTypes.SELECT
//             });
//         }
//         else if (userrole === 'supervisor') {
//             let countQuery = await db.query(`

//                  SELECT COUNT(*) AS total 

//                 FROM eve_acc_employee AS a
//                  RIGHT JOIN eve_acc_employee_attendance_reporting_system AS b ON a.id = b.empId
//                  WHERE a.status = 'A'

//                  AND a.employeeType='Blue Collar'

//                  AND (
//                      :empName IS NULL OR a.employeeName=:empName
//                      )
//                  AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId) 
//                  AND (:empCode IS NULL OR a.employeeCode = :empCode) 
//                  AND (:branchId IS NULL OR a.employeeBranchId=:branchId)
//                  AND (:deptId IS NULL OR a.employeeDepartmentId = :deptId)
//                  AND (:designId IS NULL OR a.employeeDesignationId = :designId)
//                  AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId = :subDepartmentId)
//                  AND (:location IS NULL OR a.locationID = :location)

//                   AND (:empType IS NULL OR   a.empTypeId=:empType)

//                    AND (:category IS NULL OR   a.employeeType=:category)

//                  AND (a.employeeCurrentStatus = '' 
//                  OR a.employeeCurrentStatus IS NULL 
//                  OR a.employeeCurrentStatus = 'Active'
//                  OR a.employeeCurrentStatus = 'resignation' 
//                  OR a.employeeCurrentStatus = 'joining'
//                  OR a.employeeCurrentStatus = 'termination'
//                  OR a.employeeCurrentStatus = 'release' 
//                  OR a.employeeCurrentStatus = 'offerletter')

//                  AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth
//                   AND (DATE_FORMAT(a.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR a.employeeLastWorkingDate IS NULL )

//                    AND (
//             b.appriserId = :userId 
//             OR b.reviewerId = :userId 
//             OR b.managerId = :userId
//         )
                 
//                  `,
//                 {
//                     replacements:
//                     {
//                         subCompanyId: subCompanyId,
//                         empCode: empCode,
//                         empName: empName,
//                         branchId: branchId,
//                         deptId: deptId,
//                         designId: designId,
//                         subDepartmentId: subDepartmentId,
//                         location: location,
//                         empType: empType,
//                         category: category,
//                         yearMonth: year + '-' + month,
//                         userId: tokenUserId,


//                     },
//                     type: QueryTypes.SELECT
//                 }
//             );
//             totalData = countQuery[0].total;
//             limit = parseInt(req.body.limit) || totalData;
//             let maxPage = Math.ceil(totalData / limit)
//             pageNo = parseInt(req.body.pageNo) || 1;
//             pageNo = pageNo <= maxPage ? pageNo : maxPage
//             let offset = (pageNo - 1) * limit;

//             if (totalData == 0) {
//                 return res.status(200).send({ status: false, msg: "no data found", totalData: 0, employee: [] })
//             }






//             if (!(month && year)) {
//                 return res.status(400).send({ status: false, msg: 'enter year and month' })
//             }


//             getData = await db.query(`
//                     SELECT 
//                         (@row_number := @row_number + 1) AS slno, 
//                         empId, 
//                         empName, 
//                         empCode, 
//                         branchName, 
//                         branchId, 
//                         subCompanyName, 
//                         subCompanyId, 
//                         departmentName, 
//                         deptId, 
//                         designName, 
//                         designId, 
//                         subDepartmentName, 
//                         subDepartmentId, 
//                         location, 
//                         category, 
//                         locationName,
//                         empTypeId

//                     FROM (
//                         SELECT 
//                             a.id AS empId,
//                             a.employeeName AS empName,
//                             a.employeeCode AS empCode,
//                             a.employeeBranchId AS branchName,
//                             a.employeeBranchId AS branchId,
//                             a.employeeSubCompanyId AS subCompanyName,
//                             a.employeeSubCompanyId AS subCompanyId,
//                             a.employeeDepartmentId AS departmentName,
//                             a.employeeDepartmentId AS deptId,
//                             a.employeeDesignationId AS designName,
//                             a.employeeDesignationId AS designId,
//                             a.employeeSubDepartmentId AS subDepartmentName,
//                             a.employeeSubDepartmentId AS subDepartmentId,
//                             a.locationID AS location,
//                             a.employeeType AS category,
//                             eve_acc_locationmaster.location AS locationName,
//                             a.empTypeId 
//                         FROM eve_acc_employee AS a
//                         RIGHT JOIN eve_acc_employee_attendance_reporting_system AS b ON a.id = b.empId
//                         LEFT JOIN eve_acc_locationmaster ON a.locationID = eve_acc_locationmaster.id
//                         WHERE
//                             a.status = 'A'

//                                AND a.employeeType='Blue Collar'
                               
//                             AND (:empName IS NULL OR a.employeeName = :empName)
//                             AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
//                             AND (:empCode IS NULL OR a.employeeCode = :empCode)
//                             AND (:branchId IS NULL OR a.employeeBranchId = :branchId)
//                             AND (:deptId IS NULL OR a.employeeDepartmentId = :deptId)
//                             AND (:designId IS NULL OR a.employeeDesignationId = :designId)
//                             AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId = :subDepartmentId)
//                             AND (:location IS NULL OR a.locationID = :location)

//                              AND (:empType IS NULL OR   a.empTypeId=:empType)

//                                AND (:category IS NULL OR   a.employeeType=:category)

//                             AND (
//                                 a.employeeCurrentStatus = '' 
//                                 OR a.employeeCurrentStatus IS NULL 
//                                 OR a.employeeCurrentStatus = 'Active'
//                                 OR a.employeeCurrentStatus = 'resignation' 
//                                 OR a.employeeCurrentStatus = 'joining'
//                                 OR a.employeeCurrentStatus = 'termination'
//                                 OR a.employeeCurrentStatus = 'release' 
//                                 OR a.employeeCurrentStatus = 'offerletter'
//                             )
//                             AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth
//                           AND (DATE_FORMAT(a.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR a.employeeLastWorkingDate IS NULL )
//                             AND (
//                                 b.appriserId = :userId 
//                                 OR b.reviewerId = :userId 
//                                 OR b.managerId = :userId
//                             )
//                         ORDER BY a.employeeName
//                     ) AS sub
//                     CROSS JOIN (SELECT @row_number := 0) AS init
//                     ORDER BY slno
//                     LIMIT :limit OFFSET :offset
//                 `, {
//                 replacements: {
//                     limit: limit,
//                     offset: offset,
//                     subCompanyId: subCompanyId,
//                     empCode: empCode,
//                     empName: empName,
//                     branchId: branchId,
//                     deptId: deptId,
//                     designId: designId,
//                     subDepartmentId: subDepartmentId,
//                     location: location,
//                     empType: empType,
//                     category: category,
//                     yearMonth: year + '-' + month,
//                     userId: tokenUserId,
//                 },
//                 type: QueryTypes.SELECT
//             });


//         }

//         let totalWork
//         let totalActualShift = []
//         let timeArr = []
//         let shiftArr = []

//         await Promise.all(getData.map(async (e) => {

//             e.status = 'Pending'


//             if (e.branchName != null && e.branchName != '') {
//                 e.branchName = await getBranchNameByBranchId(e.branchName, db)
//             }
//             if (!e.branchName) {
//                 e.branchName = ''
//             }
//             if (e.subCompanyName != null && e.subCompanyName != '') {
//                 e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)
//             }
//             if (e.subCompanyName == null) {
//                 e.subCompanyName = ''
//             }
//             e.empName = e.empName === null ? '' : e.empName
//             if (e.subCompanyId == null) {
//                 e.subCompanyId = ''
//             }
//             if (e.designName != null && e.designName != '') {
//                 e.designName = await getDesignationNameById(e.designName, db)
//             }
//             if (e.designName == null) {
//                 e.designName = ''
//             }
//             if (e.departmentName != null && e.departmentName != '') {
//                 e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)
//             }
//             if (e.departmentName == null) {
//                 e.departmentName = ''
//             }
//             if (e.subDepartmentName != null && e.subDepartmentName != '') {
//                 e.subDepartmentName = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentName, db)
//             }
//             if (e.subDepartmentName == null) {
//                 e.subDepartmentName = ''
//             }
//             if (e.subCompanyId != null) {

//                 e.subCompanyId = e.subCompanyId.toString()
//             }
//             if (e.employeeType == null) {
//                 e.employeeType = String
//             }
//             // if(e.location==null){
//             //     e.location=''
//             // }
//             // e.empCode=(e.empCode=null)?e.empCode='':
//             // e.branchName
//             if (e.locationName == null) {
//                 e.locationName = ''
//             }
//             e.location = (e.location === null) ? '' : e.location;
//             e.empCode = (e.empCode === null) ? '' : e.empCode;
//             e.branchName = (e.branchName === null) ? '' : e.branchName;
//             e.type = await myFunc.getEmpTypeName(e.empTypeId, db)


//             // e.actualShiftHours = ''
//             const empRoasterModel = await db.query(
//                 `
//                 SELECT
//                 a.shiftId,
//                 b.clockInTime,
//                 b.clockOutTime,
//                 b.minWorkingHour,
//                 b.minWorkingHourMin

//                 FROM eve_hrm_employee_roaster AS a
//                 LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id 
//                 WHERE a.status='A'
//                 AND employeeId=:empId

            

//                 -- AND DATE_FORMAT(a.fromDate,'%d-%m-%Y') <= :date
//                 -- AND DATE_FORMAT(a.toDate,'%d-%m-%Y') >= :date 

//                  AND YEAR(fromDate)=:year
//                  AND MONTH(fromDate)=:month
            
    
//                 `,
//                 {
//                     replacements: {
//                         empId: e.empId,
//                         year: year,
//                         month: month,
//                     },
//                     type: QueryTypes.SELECT
//                 }
//             )




//             if (empRoasterModel.length > 0 && empRoasterModel[0]['minWorkingHour'] !== null && empRoasterModel[0]['minWorkingHourMin'] !== null) {
//                 e.actualShiftHours = `${(empRoasterModel[0]['minWorkingHour'])}:${(empRoasterModel[0]['minWorkingHourMin'])}`
//                 shiftArr.push(e.actualShiftHours)
//             }
//             else {
//                 const empShiftModel = await db.query(
//                     `
//                     SELECT a.shiftId,b.minWorkingHour,b.minWorkingHourMin 
//                     FROM eve_hrm_employee_details AS a
//                     LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id  
//                     WHERE a.status='A'
//                     AND employeeId=:empId 
//                     `, {
//                     replacements: {
//                         empId: e.empId

//                     }, type: QueryTypes.SELECT
//                 }
//                 )


//                 if (empShiftModel.length > 0 && empShiftModel[0]['minWorkingHour'] !== null && empShiftModel[0]['minWorkingHourMin'] !== null) {

//                     e.actualShiftHours = `${(empShiftModel[0]['minWorkingHour'])}:${(empShiftModel[0]['minWorkingHourMin'])}`
//                     shiftArr.push(e.actualShiftHours)
//                 }
//                 else {
//                     e.actualShiftHours = ''
//                 }
//             }









//         }))
//         /************************************************************************************** */
//         //Case==creditSetting of employees



//         let eve_self_registration = await db.query('select * from  eve_self_registration where status="A"', {
//             type: QueryTypes.SELECT
//         })

//         for (let i = 0; i < getData.length; i++) {
//             for (let j = 0; j < eve_self_registration.length; j++) {
//                 if (getData[i].empId == eve_self_registration[j].empId && month == eve_self_registration[j].mm && year == eve_self_registration[j].yyyy) {
//                     getData[i].creditSetting = [{
//                         creditDay: eve_self_registration[j].creadit_month,
//                         creditUsed: eve_self_registration[j].used,
//                         employeeId: eve_self_registration[j].empId
//                     }]
//                 }
//             }
//         }

//         /******************************************************************************** */


//         getData = getData.map((value) => {
//             value.compOff = []
//             return value
//         })
//         getData = getData.map((value) => {
//             value.holidayArr = []
//             return value
//         })
//         getData = getData.map((value) => {
//             value.inOutArr = []
//             return value
//         })

//         //***********************************************************************//

//         //Case=EarningSalary

//         //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise



//         getData = getData.map((value) => {
//             value.earningSalary = 0
//             return value
//         })

//         //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise
//         let monthlySalaryDb = await db.query('select * from eve_acc_set_monthly_salary_employee_wise where status="A"', {
//             type: QueryTypes.SELECT
//         })

//         let extra_duty_off_paid = await db.query('select * from  eve_acc_module_activation_master where status="A" && name=:name', {
//             replacements: {
//                 name: "extra_duty_off_paid"
//             },
//             type: QueryTypes.SELECT
//         })

//         for (let i = 0; i < getData.length; i++) {

//             for (let j = 0; j < monthlySalaryDb.length; j++) {



//                 if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'addition') {

//                     getData[i].earningSalary += (parseFloat(monthlySalaryDb[j].salaryAmount))


//                 }
//                 else if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'deduction') {
//                     getData[i].earningSalary -= (parseFloat(monthlySalaryDb[j].salaryAmount))



//                 }
//             }
//         }


//         //extraDutyEmpById

//         let totalDaysOfMOnth = getDaysInMonth(year, month);
//         let startDate = `${year}-${month}-01`

//         let endDate = `${year}-${month}-${totalDaysOfMOnth}`


//         let totalCompOffDays = 0
//         for (let i = 0; i < getData.length; i++) {
//             getData[i].Amount = formatAmount((getData[i].earningSalary) / totalDaysOfMOnth)
//             // getData[i].Amount = ((getData[i].earningSalary)/totalDaysOfMOnth)

//             getData[i].earningSalary = formatAmount(getData[i].earningSalary)
//             // getData[i].earningSalary = (getData[i].earningSalary)


//         }

//         if ((extra_duty_off_paid.length) > 0) {


//             let eve_acc_extra_duty_encashment_calculation_setting = await db.query('select * from eve_acc_extra_duty_encashment_calculation_setting where status="A"', {
//                 type: QueryTypes.SELECT
//             })

//             let extraDuty = eve_acc_extra_duty_encashment_calculation_setting



//             let tempSalaryAmount = 0

//             for (let i = 0; i < extraDuty.length; i++) {
//                 for (let j = 0; j < monthlySalaryDb.length; j++) {

//                     if (extraDuty[i].salaryTemplateId == monthlySalaryDb[j].salaryTempId && extraDuty[i].salaryComponents) {

//                     }
//                 }
//             }


//         }

//         //fixedWeeklyHoliday

//         getData = getData.map((value) => {
//             value.fixedWeeklyOffDay = ''
//             return value
//         })

//         let fixedWeeklyHolidayDb = await db.query('select * from eve_acc_company_fix_weekly_holiday where status="A"', {
//             type: QueryTypes.SELECT
//         })



//         for (let i = 0; i < getData.length; i++) {
//             for (let j = 0; j < fixedWeeklyHolidayDb.length; j++) {


//                 if (getData[i].branchId == fixedWeeklyHolidayDb[j].branchId) {
//                     getData[i].fixedWeeklyOffDay = fixedWeeklyHolidayDb[j].day
//                 }

//             }
//         }

//         //******************************************************************//
//         //additionalWeeklyOffDay

//         function weeklyHolidayArrayFn(options) {

//             let days = ['sunday', 'monday', 'tuesday', "wednesday", "thursday", 'friday', 'saturday']

//             let { month, year, dayName, dayNoStr } = options
//             let date = moment(`${year}-${month}-01`)
//             // console.log(date);
//             let dayIndex = days.indexOf(dayName)
//             let currentDay = date.format('dddd').toLowerCase()
//             let currentDayIndex = days.indexOf(currentDay)
//             let firstDayNo = '01'

//             if (dayIndex > currentDayIndex) {

//                 firstDayNo = (dayIndex - currentDayIndex) + 1

//             }
//             else if (dayIndex < currentDayIndex) {

//                 let diffAfterCurrentDay = (days.length) - (currentDayIndex)
//                 let diffBeforeDay = dayIndex + 1
//                 firstDayNo = diffAfterCurrentDay + diffBeforeDay
//             }

//             else if (dayIndex == currentDayIndex) {
//                 firstDayNo = 1
//             }

//             let dayNo = dayNoStr.toString().replace(/(?![0-9])./g, '') * 1
//             if (dayNo > 1) {

//                 firstDayNo += (7 * (dayNo - 1))

//             }
//             // return firstDayNo
//             return (firstDayNo < 10 ? `0${firstDayNo}` : `${firstDayNo}`)
//         }


//         getData = getData.map((value) => {
//             value.additionalWeeklyOffDay = {
//                 day: null,
//                 weeklyHolidayArray: []
//             }
//             return value
//         })


//         let companyWeeklyHolidayDb = await db.query('select * from eve_acc_company_weekly_holiday where status="A"', { type: QueryTypes.SELECT })


//         for (let i = 0; i < getData.length; i++) {

//             for (let j = 0; j < companyWeeklyHolidayDb.length; j++) {

//                 if (getData[i].branchId == companyWeeklyHolidayDb[j].branchId) {

//                     let options = {
//                         month: month,
//                         year: year,
//                         dayName: companyWeeklyHolidayDb[j].day
//                             ? companyWeeklyHolidayDb[j].day.toLowerCase()
//                             : '',
//                     }

//                     getData[i].additionalWeeklyOffDay.day = companyWeeklyHolidayDb[j].day
//                     if (typeof (companyWeeklyHolidayDb[j].weeks) == "string" && companyWeeklyHolidayDb[j].weeks !== "null") {
//                         let weeksArray = companyWeeklyHolidayDb[j].weeks.split(',')


//                         for (let k = 0; k < weeksArray.length; k++) {

//                             options.dayNoStr = weeksArray[k]
//                             getData[i].additionalWeeklyOffDay.weeklyHolidayArray.push(weeklyHolidayArrayFn(options))

//                         }
//                     }
//                 }
//             }
//         }
//         //****************************************************************************//


//         getData = getData.map((value) => {
//             value.empId = value.empId.toString()
//             return value
//         })

//         getData = getData.map((value) => {
//             value.base64_empId = Buffer.from(value.empId || '').toString('base64')
//             return value
//         })

//         //sandwich_leave


//         let sandwich_leave = await db.query('select * from eve_acc_module_activation_master where status="A" && name="sandwich_leave"', { type: QueryTypes.SELECT })

//         //appDetails

//         function getDaysInMonth(year, month) {
//             return new Date(year, month, 0).getDate();
//         }

//         const daysInCurrentMonth = getDaysInMonth(year, month);

//         let NoOfdaysInMonth = parseInt(daysInCurrentMonth)


//         getData = getData.map((value) => {
//             value.totalDays = NoOfdaysInMonth
//             return value
//         })


//         let employeeAttendance = await db.query('select * from eve_acc_employee_attendence where status="A"', {
//             type: QueryTypes.SELECT
//         })

//         const appDetailsObj = [];

//         for (let i = 1; i <= NoOfdaysInMonth; i++) {
//             let number = i.toString().padStart(2, '0');
//             // console.log(number);
//             let empDtStrdate = new Date(`${year}-${month}-${number}`);

//             let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

//             let newObj = {
//                 crtDate: `${year}-${month}-${number}`,
//                 intime: "--",
//                 outTime: "--",
//                 workingHour: "--",
//                 attStatus: "--",
//                 empDtStr: `${timestamp}`,
//                 backcolor: "--",
//                 title: "--",
//                 idleWageStatus: '--',
//                 lateAttendanceForLToolTip: '',
//                 lateAttendanceForLValue: '',
//                 shiftName: '',
//             };


//             appDetailsObj.push(newObj);
//         }

//         let employeeAttendanceApproved = await db.query('select * from eve_acc_employee_attendence_approved where status="A" ', {
//             type: QueryTypes.SELECT
//         })

//         let eve_acc_company_holiday = await db.query('select * from eve_acc_company_holiday where status="A" ', {
//             type: QueryTypes.SELECT
//         })



//         getData.map((value) => {
//             value.totalFullDay = 0
//             value.totalPresentDay = 0
//             value.totalAbsent = 0
//             value.totalHalfDay = 0
//             value.totalReject = 0
//             value.totalRejectedSunday = 0
//             value.totalPaidLeave = 0
//             value.totalUnpaidLeave = 0
//             value.totalHalfdayPaidLeave = 0
//             value.totalHalfdayPaidLeave = 0
//             value.totalHalfdayunpaidLeave = 0
//             value.totalMarkedAsHoliday = 0
//             value.totalWorkingHour = 0
//             value.totalPaidHoliday = 0
//             // return value
//         })

//         let totalIdleWagesDays = 0

//         for (let i = 0; i < getData.length; i++) {

//             let statusArray = []

//             let value = getData[i]

//             let _appDetailsObj = JSON.parse(JSON.stringify(appDetailsObj))

//             value.idleWageStatusCount = 0


//             let employeeAttendanceId = employeeAttendance.filter((x) => {
//                 return value.empId == x.empId
//             })
//             let empAttendanceIdOfApproved = employeeAttendanceApproved.filter((x) => {
//                 return value.empId == x.employeeId
//             })
//             /************************************************** */
//             let employeeBranchId = eve_acc_company_holiday.filter((x) => {
//                 if (value.branchId == x.branchId) {
//                     return true
//                 }
//                 // return value.branchId = x.branchId
//             })

//             // console.log(employeeBranchId);

//             /*****************************************/

//             for (let j = 0; j < _appDetailsObj.length; j++) {
//                 let _appDetail = _appDetailsObj[j]

//                 let targetObj = employeeAttendanceId.find((e) => {
//                     return (e.empId == value.empId && _appDetail.crtDate == e.date)
//                 })
//                 let targetObjOfApproved = empAttendanceIdOfApproved.find((e) => {
//                     return (e.employeeId == value.empId && _appDetail.crtDate == e.date)
//                 })

//                 let targetObjOfCompanyHoliday = employeeBranchId.find((e) => {
//                     return (e.branchId == value.branchId && _appDetail.crtDate == e.date)
//                 })


//                 if (targetObj) {
//                     if (targetObj.intime != null) {

//                         _appDetail.intime = targetObj.intime
//                     }
//                     if (targetObj.outTime != null) {

//                         _appDetail.outTime = targetObj.outTime
//                     }

//                     if (targetObj.intime != "--:undefined") {
//                         _appDetail.intime = targetObj.intime
//                     }

//                     if (targetObj.outTime != "--:undefined") {
//                         _appDetail.outTime = targetObj.outTime
//                     }
//                     if (targetObj.intime == '') {
//                         _appDetail.intime = '--'
//                     }
//                     if (targetObj.outTime == '') {
//                         _appDetail.outTime = '--'
//                     }


//                     //inOutArr

//                     if (targetObj.intime != null && targetObj.outTime != null && targetObj.intime != '' && targetObj.outTime != '') {
//                         getData[i].inOutArr.push({
//                             date: _appDetail.crtDate,
//                             inTime: targetObj.intime,
//                             outTime: targetObj.outTime,
//                             intimeStatus: '0',
//                             outtimeStatus: '0',
//                             workingHourInMin: ''

//                         })


//                     }

//                     // const time1 = targetObj.outTime
//                     // const time2 = targetObj.intime

//                     // const timeMoment1 = moment(time1, "HH:mm");
//                     // const timeMoment2 = moment(time2, "HH:mm");
//                     // const hour1 = timeMoment1.hour();
//                     // const hour2 = timeMoment2.hour();


//                     // if (hour1 > hour2) {
//                     //     const duration = moment.duration(moment(time1, 'HH:mm').diff(moment(time2, 'HH:mm')));

//                     //     let differenceHours = duration.hours();

//                     //     let differenceMinutes = duration.minutes();


//                     //     if (differenceHours < 10) {
//                     //         differenceHours = `0${differenceHours}`
//                     //     }

//                     //     if (differenceMinutes < 10) {
//                     //         differenceMinutes = `0${differenceMinutes}`
//                     //     }
//                     //     if (_appDetail.intime && _appDetail.outTime != ":" && _appDetail.outTime) {

//                     //         _appDetail.workingHour = `${differenceHours}:${differenceMinutes}`
//                     //     }
//                     // }
//                     if (_appDetail.intime && _appDetail.outTime != ":" && _appDetail.outTime && _appDetail.outTime != "--") {
//                         _appDetail.workingHour = calculateWorkingHours(_appDetail.intime, _appDetail.outTime)
//                     }
//                 }

//                 if ((targetObjOfApproved) && (sandwich_leave.length > 0)) {

//                     _appDetail.idleWageStatus = targetObjOfApproved.idleWageStatus

//                     if (targetObjOfApproved.idleWageStatus == 'yes') {
//                         value.idleWageStatusCount++
//                         totalIdleWagesDays++
//                     }


//                     if (targetObjOfApproved.type == "full") {
//                         _appDetail.backcolor = "#a4eab0"
//                         _appDetail.title = "Present";
//                         _appDetail.attStatus = "Fullday"
//                         getData[i].totalFullDay++
//                         getData[i].totalPresentDay++
//                         statusArray.push(_appDetail.title)

//                     }



//                     else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks != "AB LEAVE" && targetObjOfApproved.remarks != "First Half" && targetObjOfApproved.remark != "Second Half") {
//                         _appDetail.attStatus = "Absent"
//                         _appDetail.backcolor = "#f1bcbc"
//                         _appDetail.title = "Absent";
//                         getData[i].totalReject++
//                         getData[i].totalAbsent++
//                         statusArray.push(_appDetail.title)
//                     }




//                     else if (targetObjOfApproved.type == "half") {
//                         _appDetail.attStatus = "Halfday"
//                         _appDetail.backcolor = "#b1b82c"
//                         _appDetail.title = "Halfday";
//                         getData[i].totalHalfDay++
//                         statusArray.push(_appDetail.title)

//                     }




//                     else if (targetObjOfApproved.leaveTypeId && targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'L LEAVE' && targetObjOfApproved.leaveTypeId != '') {


//                         let leaveResult = await leaveType(targetObjOfApproved.leaveTypeId, db)

//                         _appDetail.backcolor = leaveResult.colorCode
//                         _appDetail.title = leaveResult.name
//                         _appDetail.attStatus = leaveResult.prefix

//                         statusArray.push(_appDetail.title)

//                         getData[i].totalPaidLeave++

//                         if (targetObjOfApproved.flagRemarks == "ForLateClockIn") {
//                             _appDetail.title = " For Late ClockIn";
//                             _appDetail.lateClockIn = "Leave Deducted For Late ClockIn"

//                             statusArray.push(_appDetail.title)

//                         }

//                     }




//                     else if (targetObjOfApproved.type == "holiday" && targetObjOfApproved.remarks == "L LEAVE" && targetObjOfApproved.leaveTypeId == '') {
//                         _appDetail.attStatus = "D-PL"
//                         _appDetail.backcolor = "#85eaea"
//                         _appDetail.title = "Default Paid Leave";

//                         statusArray.push(_appDetail.title)
//                         getData[i].totalPaidLeave++
//                     }





//                     else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks == "AB LEAVE") {
//                         _appDetail.attStatus = "UL"
//                         _appDetail.backcolor = "#f17171"
//                         _appDetail.title = "Unpaid Leave";

//                         statusArray.push(_appDetail.title)
//                         getData[i].totalUnpaidLeave++
//                     }



//                     else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
//                         _appDetail.attStatus = 'HD-PL'
//                         _appDetail.backcolor = '#ffa742'
//                         _appDetail.title = 'Halfday Paid Leave';

//                         statusArray.push(_appDetail.title)
//                         getData[i].totalHalfdayPaidLeave++;
//                     }




//                     else if (targetObjOfApproved.type == 'reject' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
//                         _appDetail.attStatus = 'HD-UL'
//                         _appDetail.backcolor = '#b0f320'
//                         _appDetail.title = 'Halfday unpaid Leave';

//                         statusArray.push(_appDetail.title)
//                         getData[i].totalHalfdayunpaidLeave++;
//                     }



//                     else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks != 'L LEAVE' && targetObjOfApproved.remarks != 'First Half' && targetObjOfApproved.remarks != 'Second Half') {
//                         _appDetail.attStatus = 'Marked as Holiday'
//                         _appDetail.backcolor = '#ccffcc'
//                         _appDetail.title = 'Marked as Holiday';

//                         statusArray.push(_appDetail.title)
//                         getData[i].totalMarkedAsHoliday++
//                     }




//                     else if (targetObjOfApproved.type == "sunday reject") {
//                         _appDetail.attStatus = "Absent"
//                         _appDetail.backcolor = "#f1bcbc"
//                         _appDetail.title = "Absent";

//                         statusArray.push(_appDetail.title)
//                         getData[i].totalReject++
//                         getData[i].totalAbsent++
//                     }


//                 }

//                 /***********************************************************/

//                 else {

//                     _appDetail.attStatus = "-";
//                     _appDetail.backcolor = "#fff";
//                     _appDetail.title = "";
//                     statusArray.push(_appDetail.title)

//                     if (targetObjOfCompanyHoliday) {
//                         _appDetail.backcolor = "#09ff00";

//                         // getData[i].totalHoliDay++
//                         getData[i].totalPaidHoliday++



//                     }

//                     else if (moment(_appDetail.crtDate).format('dddd') == getData[i].fixedWeeklyOffDay) {
//                         _appDetail.attStatus = "Off Day";
//                         _appDetail.backcolor = "#e8e4e4";
//                         _appDetail.title = "Off Day";

//                         statusArray.push(_appDetail.title)

//                         // getData[i].totalOffDay++
//                         getData[i].totalPaidHoliday++
//                     }

//                     else if (
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[0]
//                         ||
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[1]
//                         ||
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[2]
//                         ||
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[3]
//                         ||
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[4]

//                     ) {
//                         _appDetail.attStatus = "Off Day";
//                         _appDetail.backcolor = "#e8e4e4";
//                         _appDetail.title = "Off Day";

//                         statusArray.push(_appDetail.title)
//                         // getData[i].totalOffDay++
//                         getData[i].totalPaidHoliday++

//                     }
//                 }
//                 let timeSchedule = await myFunc.getEmployeeWiseOfficeSchedule(value.empId, _appDetail.crtDate, db)

//                 let shiftName = await myFunc.getShiftName(value.empId, _appDetail.crtDate, db)
//                 _appDetail.shiftName = shiftName || ''



//                 if (_appDetail.intime !== '') {
//                     if (timeSchedule) {
//                         if (moment(_appDetail.intime, 'HH:mm') > (moment(timeSchedule, 'HH:mm'))) {
//                             _appDetail.lateAttendanceForLToolTip = 'Late Punch In';
//                             _appDetail.lateAttendanceForLValue = 'L';
//                         }
//                     }


//                     else {
//                         let company = await db1.query(
//                             `
//                                             SELECT * FROM eve_main_company
//                                             WHERE status = 'A' AND id = :id
//                                             `,
//                             {
//                                 replacements: { id: tokenCompanyId },
//                                 type: QueryTypes.SELECT
//                             }
//                         );

//                         if (company.length > 0 && company[0].lateTimeEnd) {



//                             if (moment(_appDetail.intime, 'HH:mm').isAfter(moment(company[0].lateTimeEnd, 'HH:mm'))) {
//                                 _appDetail.lateAttendanceForLToolTip = 'Late Punch In';
//                                 _appDetail.lateAttendanceForLValue = 'L';
//                             }
//                         }
//                     }
//                 }
//                 value.appDetails = _appDetailsObj


//             }
//             let isAllHalfday = statusArray.length === NoOfdaysInMonth && statusArray.every(value => value === 'Halfday');

//             if (isAllHalfday) {
//                 value.status = 'Half Day Approved'
//             }

//             let isAllPresent = statusArray.length === NoOfdaysInMonth && statusArray.every(value => value === 'Present');

//             if (isAllPresent) {
//                 value.status = 'Full Day Approved'
//             }

//         }

//         // TotalWorkingHours
//         let formattedHours
//         let formattedMinutes

//         for (let i = 0; i < getData.length; i++) {
//             let value = []
//             for (let j = 0; j < NoOfdaysInMonth; j++) {
//                 if (getData[i].appDetails[j].workingHour != '--') {
//                     value.push(getData[i].appDetails[j].workingHour)
//                 }
//             }
//             // console.log(value);
//             const totalMinutes = value.reduce((sum, time) => {
//                 const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]
//                 return sum + hours * 60 + minutes;
//             }, 0);

//             const hours = Math.floor(totalMinutes / 60)
//             const minutes = totalMinutes % 60;
//             formattedHours = String(hours).padStart(2, "0");
//             formattedMinutes = String(minutes).padStart(2, "0")

//             getData[i].totalWorkingHour = `${formattedHours}:${formattedMinutes}`;


//         }


//         //workingHour

//         function subtractTime(time1, time2) {
//             // Parse time strings into hour and minute components
//             const [hour1, minute1] = time1.split(':').map(Number);
//             const [hour2, minute2] = time2.split(':').map(Number);

//             // Convert hour and minute components into total minutes
//             const totalMinutes1 = hour1 * 60 + minute1;
//             const totalMinutes2 = hour2 * 60 + minute2;

//             // Subtract the total minutes of the second time from the first time
//             let diffMinutes = totalMinutes1 - totalMinutes2;

//             if (diffMinutes < 0) {
//                 // If the result is negative, assume we are crossing midnight and add 24 hours worth of minutes
//                 diffMinutes += 24 * 60;
//             }

//             // Convert the result back to the "hh:mm" format
//             const diffHours = Math.floor(diffMinutes / 60);
//             const diffMins = diffMinutes % 60;

//             // Add leading zeros for single-digit hours/minutes
//             const formattedDiff = `${String(diffHours).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
//             return formattedDiff;
//         }




//         function convertTimeToMinutes(time) {
//             const [hour, minute] = time.split(':').map(Number);
//             const totalMinutes = hour * 60 + minute;
//             return totalMinutes;
//         }

//         for (let i = 0; i < getData.length; i++) {

//             let n = getData[i].inOutArr.length

//             for (let j = 0; j < n; j++) {

//                 let time1 = getData[i].inOutArr[j].outTime
//                 let time2 = getData[i].inOutArr[j].inTime

//                 getData[i].inOutArr[j].workingHourInMin = subtractTime(time1, time2)
//                 getData[i].inOutArr[j].workingHourInMin = convertTimeToMinutes(getData[i].inOutArr[j].workingHourInMin)



//             }
//         }


//         //NetPaidDays
//         let totalPresent = 0
//         let totalHalfDay = 0
//         let totalAbsent = 0
//         let totalPaidLeave = 0
//         let totalUnpaidLeave = 0
//         getData.map((e) => {
//             e.NetPaidDays = NoOfdaysInMonth.toString()
//             if (e.branchName == null) {
//                 e.branchName = ''
//             }
//             if (e.empCode == null) {
//                 e.empCode = ''
//             }
//             if (e.deptId == null) {
//                 e.deptId = ''
//             }
//             if (e.designId == null) {
//                 e.designId = ''
//             }
//             if (e.subDepartmentId == null) {
//                 e.subDepartmentId = ''
//             }
//             if (e.location == null) {
//                 e.location = ''
//             }
//             timeArr.push(e.totalWorkingHour)
//             totalPresent += parseInt(e.totalFullDay)
//             totalHalfDay += parseInt(e.totalHalfDay)
//             totalAbsent += parseInt(e.totalAbsent)
//             totalPaidLeave += parseInt(e.totalPaidLeave)
//             totalUnpaidLeave += parseInt(e.totalUnpaidLeave)
//         })
//         totalWork = addTimes(timeArr)

//         totalActualShift = myFunc.addTimes(shiftArr)



//         //count total fixed holiday in a month of employee

//         // function countDayInMonth(year, month, targetDay) {

//         //     const firstDayOfMonth = new Date(year, month - 1, 1);
//         //     const firstDayOfWeek = firstDayOfMonth.getDay();
//         //     const daysInMonth = new Date(year, month, 0).getDate();
//         //     let targetDayCount = 0;
//         //     const targetDayOfWeek = (targetDay - firstDayOfWeek + 7) % 7;

//         //     for (let day = 0; day < daysInMonth; day++) {
//         //         const currentDayOfWeek = (firstDayOfWeek + day) % 7;
//         //         if (currentDayOfWeek === targetDayOfWeek) {

//         //             targetDayCount++;
//         //         }
//         //     }
//         //     return targetDayCount;
//         // }
//         let totalSalaryExpenses = 0
//         for (let i = 0; i < getData.length; i++) {
//             getData[i].totalPaidHoliday = (getData[i].totalPaidHoliday) - (getData[i].totalRejectedSunday)
//             if (getData[i].totalPaidHoliday >= 10) {

//                 getData[i].totalPaidHoliday = `${getData[i].totalPaidHoliday.toString()}`

//             }
//             else if (getData[i].totalPaidHoliday >= 1 || getData[i].totalPaidHoliday <= 9) {

//                 getData[i].totalPaidHoliday = `0${getData[i].totalPaidHoliday.toString()}`
//             }
//             else if (getData[i].totalPaidHoliday == 0) {
//                 getData[i].totalPaidHoliday = `00`
//             }

//             let e = getData[i]
//             for (let j = 0; j < NoOfdaysInMonth; j++) {

//                 e.appDetails[j].crtDate = moment(e.appDetails[j].crtDate).format("DD/MM/YYYY");
//             }
//         }




//         let attendanceReportExcel = getData.map((e, i) => ({
//             'Sl. No.': Number(i + 1),
//             'Worker Name': e.empName,
//             'Worker Code': e.empCode,
//             'Category': e.category,
//             'Type': e.type,
//             'Sub Company': e.subCompanyName,
//             'Branch': e.branchName,
//             'Location': e.locationName,
//             'Department': e.departmentName,
//             'Sub Department': e.subDepartmentName,
//             'Designation': e.designName,
//             'App': e.appDetails,
//             'Total Work Hours': e.totalWorkingHour,
//             'Actual Shift Hours': e.actualShiftHours,
//             // 'Status': e.status,
//             'Present': e.totalPresentDay,
//             'Half Day': e.totalHalfDay,
//             'Absent': e.totalAbsent,
//             'Total Idle Wage Days': e.idleWageStatusCount,
//             'Paid Leave': e.totalPaidLeave,
//             'Unpaid Leave': e.totalUnpaidLeave,
//         }))

//         return res.status(200).send({
//             recordedPerPage: limit,
//             currentPage: pageNo,
//             totalData: totalData,

//             totalSalaryExpenses: totalSalaryExpenses,
//             totalWork: totalWork,
//             totalActualShift: totalActualShift,
//             totalPresent: totalPresent,
//             totalHalfDay: totalHalfDay,
//             totalAbsent: totalAbsent,
//             totalPaidLeave: totalPaidLeave,
//             totalUnpaidLeave: totalUnpaidLeave,
//             totalIdleWagesDays: totalIdleWagesDays,
//             employee: getData,
//             // employee: myFunc.replaceEmptyValues(attendanceReportExcel),

//         })
//     }
//     catch (error) {
//         return res.status(500).send({ status: false, msg: error.message })
//     }
// }
// async function fetchData({ token, year, month, userrole, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category }) {
//     try {
//         const config = {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'x-cross-auth': token
//             },
//             method: 'POST',
//             url: `${process.env.BASE_URL}/report/getmonthlyAttendanceExcel`,

//             data: { token, year, month, userrole, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category }
//         }
//         const response = await axios(config)
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// }
// function getColumnLetter(columnNumber) {
//     let columnName = '';
//     while (columnNumber > 0) {
//         let remainder = (columnNumber - 1) % 26;
//         columnName = String.fromCharCode(65 + remainder) + columnName;
//         columnNumber = Math.floor((columnNumber - 1) / 26);
//     }
//     return columnName;
// }


// async function createExcelFile(data) {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Sheet1');
//     let values = []
//     let employee = data.employee
//     let header = Object.keys(employee[0])
//     let subHeader = []
//     let midHeader = []

//     let appIndex = header.indexOf('App')

//     let mergeColumn = []



//     employee[0].App.forEach((e, i) => {
//         midHeader.push(e.crtDate, '', '', '', '', '')
//         subHeader.push('In Time', 'Out Time', 'Working hr.', 'Status', 'Shift/Roster Name', 'Late Mark')

//         let startColumn = (appIndex + 1) + (i * 6)
//         let endColumn = (startColumn + 5)
//         let endRow = 1
//         let startRow = 1
//         mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
//         // worksheet.mergeCells(`${getColumnLetter(startColumn)}2:${getColumnLetter(endColumn)}2`)
//     })

//     // console.log(mergeColumn);

//     header.splice(appIndex, 1, ...midHeader)

//     subHeader.unshift(...new Array(appIndex).fill(''))


//     values.push(header)
//     values.push(subHeader)

//     employee.forEach(e => {
//         let value = Object.values(e)
//         let row = []
//         value.forEach((x, i) => {
//             if (Array.isArray(x)) {
//                 x.forEach((z, k) => {
//                     row.push(z.intime, z.outTime, z.workingHour, z.attStatus, z.shiftName, z.lateAttendanceForLValue)
//                 })
//             }
//             else {
//                 row.push(x)
//             }
//         })


//         values.push(row)

//     });
//     // Assuming 'header' is defined and contains the correct headers

//     // Get indices for the required columns
//     let totalWorkIndex = header.indexOf('Total Work Hours') + 1; // Add 1 because ExcelJS uses 1-based index
//     let totalActualIndex = header.indexOf('Actual Shift Hours') + 1;
//     let totalPresent = header.indexOf('Present') + 1;
//     let totalHalfDay = header.indexOf('Half Day') + 1;
//     let totalAbsent = header.indexOf('Absent') + 1;
//     let totalPaidLeave = header.indexOf('Paid Leave') + 1;
//     let totalUnpaidLeave = header.indexOf('Unpaid Leave') + 1;
//     let status = header.indexOf('Status') + 1;
//     let total = header.indexOf('Sl. No.') + 1; // Adjusted as ExcelJS is 1-based
//     let totalIdleWagesDays = header.indexOf('Total Idle Wage Days') + 1; // Adjusted as ExcelJS is 1-based

//     // Log indices for debugging


//     // Prepare data row with appropriate length
//     let len = header.length;
//     let row = new Array(len).fill('');

//     // Assign data values to their respective indices
//     row[totalWorkIndex - 1] = data['totalWork']; // Use 0-based for array
//     row[totalActualIndex - 1] = data['totalActualShift'];
//     row[totalPresent - 1] = data['totalPresent'];
//     row[totalHalfDay - 1] = data['totalHalfDay'];
//     row[totalAbsent - 1] = data['totalAbsent'];
//     row[totalPaidLeave - 1] = data['totalPaidLeave'];
//     row[totalUnpaidLeave - 1] = data['totalUnpaidLeave'];
//     row[totalIdleWagesDays - 1] = data['totalIdleWagesDays'];
//     row[total - 1] = 'TOTAL';

//     // Push the row into values array
//     values.push(row);

//     // Add the values to the worksheet
//     worksheet.addRows(values);

//     // Merge cells as required
//     mergeColumn.forEach((e) => {
//         worksheet.mergeCells(e);
//     });

//     // Setting cell values using calculated indices
//     worksheet.getCell(2, totalWorkIndex).value = '';
//     worksheet.getCell(2, totalActualIndex).value = '';
//     worksheet.getCell(2, totalPresent).value = '';
//     worksheet.getCell(2, totalHalfDay).value = '';
//     worksheet.getCell(2, totalAbsent).value = '';
//     worksheet.getCell(2, totalPaidLeave).value = '';
//     worksheet.getCell(2, totalUnpaidLeave).value = '';
//     // worksheet.getCell(2, status).value = '';
//     worksheet.getCell(2, totalIdleWagesDays).value = '';


//     const headerRow = worksheet.getRow(1);
//     const headerRow2 = worksheet.getRow(2);

//     worksheet.eachRow((row) => {
//         row.eachCell((cell) => {
//             cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
//             cell.border = {
//                 top: { style: 'thin' },
//                 left: { style: 'thin' },
//                 bottom: { style: 'thin' },
//                 right: { style: 'thin' },
//             };

//             row.height = 25

//         });
//     });
//     headerRow.eachCell(cell => {
//         // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
//         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
//         cell.font = { bold: true };

//     });
//     headerRow2.eachCell(cell => {
//         // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
//         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
//         cell.font = { bold: true };

//     });

//     worksheet.columns.forEach(column => {
//         column.width = 20;
//     });


//     const lastRow = worksheet.lastRow;
//     lastRow.eachCell((cell, colNumber) => {
//         cell.font = { bold: true };
//     });


//     return workbook.xlsx
// }

// async function getMonthlyAttendanceExcelSheet(req, res) {
//     try {
//         let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
//         let year = (req.body.year || req.query.year)
//         let month = (req.body.month || req.query.month)
//         let limit = (req.body.limit || req.query.limit)
//         let pageNo = (req.body.pageNo || req.query.pageNo)
//         let empCode = (req.body.empCode || req.query.empCode)
//         let empName = (req.body.empName || req.query.empName)
//         let branchId = (req.body.branchId || req.query.branchId)
//         let deptId = (req.body.deptId || req.query.deptId)
//         let designId = (req.body.designId || req.query.designId)
//         let subCompanyId = (req.body.subCompanyId || req.query.subCompanyId)
//         let subDepartmentId = (req.body.subDepartmentId || req.query.subDepartmentId)
//         let location = (req.body.location || req.query.location)
//         let userrole = (req.body.userrole || req.query.userrole)
//         let empType = (req.body.empType || req.query.empType)
//         let category = (req.body.category || req.query.category)

//         let apiData = await fetchData({ token, year, userrole, month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category })
//         // if (apiData.employee.length == 0) {
//         //     return res.status(400).send({ status: false, msg: 'no data found' })
//         // }


//         let getExcel = createExcelFile(apiData)


//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', `attachment; filename="monthlyAttendance.xlsx"`);

//         (await getExcel).write(res)

//     } catch (error) {
//         return res.status(500).send({ status: false, msg: error.message, error: error.stack })
//     }
// }

// module.exports = { getMonthlyAttendanceExcel, getMonthlyAttendanceExcelSheet }










// let sequelize = require("../config/db")
// const { QueryTypes } = require('sequelize')
// const moment = require('moment')
// const axios = require('axios')
// const ExcelJS = require('exceljs')
// const myFunc=require('../functions/functions')


// async function moduleActivation(name, db) {
//     let module = await db.query('select status from eve_acc_module_activation_master where name=:name', {
//         replacements: {
//             name: name,
//         }, type: QueryTypes.SELECT
//     })
//     if (module[0]) {
//         let res = Object.values(module[0])
//         let newRes = res.toString()
//         if (newRes == 'A') {
//             newRes = 'yes'
//         } else {
//             newRes = 'no'
//         }
//         return newRes
//     }
// }

// function addTimes(times) {
//     let totalMinutes = 0;

//     // Convert each time to minutes and add to the total
//     times.forEach(time => {
//         const timeMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
//         totalMinutes += timeMinutes;
//     });

//     // Convert the total minutes back to hours and minutes
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;

//     // Format the result
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
// }



// function formatAmount(numericString) {

//     if (numericString != null) {
//         let numericValue = numericString
//         let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
//         return formattedString
//     }
// }
// const departmentNameByDepartmentId = async (id, db) => {
//     let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subDepartment[0]) {
//         let res = Object.values(subDepartment[0])
//         let newRes = res.toString()
//         return newRes
//     }
// }
// const getEmployeeNameById = async (id, db) => {
//     let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })

//     if (employeeName[0]) {

//         let res = Object.values(employeeName[0])
//         let newRes = (res.toString());
//         return newRes
//     }
// }


// const getBranchNameByBranchId = async (id, db) => {
//     let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {
//         replacements: {
//             branchId: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (branchName[0]) {

//         let res = Object.values(branchName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }
// const getDesignationNameById = async (id, db) => {
//     let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     }
//     )

//     if (designationName[0]) {
//         let res = Object.values(designationName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }

// const getSubCompanyNameById = async (id, db) => {
//     let subCompanyName = await db.query('select companyName from eve_acc_subCompany where id=:id && status="A"', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subCompanyName[0]) {
//         let res = Object.values(subCompanyName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }
// const getSubDepartmentNameBySubDepartmentId = async (id, db) => {
//     let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subDepartment[0]) {
//         let res = Object.values(subDepartment[0])
//         let newRes = res.toString()
//         return newRes
//     }
// }
// const leaveType = async (leaveTypeId, db) => {

//     let empleaveType = await db.query(`
//                                       SELECT name,prefix,colorCode
//                                       FROM eve_acc_leave_type 
//                                       WHERE id=:id`,
//         {

//             replacements: {
//                 id: leaveTypeId
//             },
//             type: QueryTypes.SELECT
//         })
//     if (empleaveType[0]) {
//         // let res = Object.values(empleaveType[0])
//         // let newRes = res.toString()
//         // return newRes
//         return empleaveType[0]
//     }
//     else{
//         return ''
//     }
// }

// const getMonthlyAttendanceExcel = async (req, res) => {

//     try {
//         const decodedToken = req.headerSession
//         const tokenUserId = decodedToken.userId
//         const tokenCompanyId = decodedToken.companyId
//         const tokenbranchId = decodedToken.branchId
//         const tokenMainUserId = decodedToken.mainUserId
//         let db = sequelize(tokenCompanyId)


//         //  const tokenUserId = '29'
//         // let db = sequelize('59')
//         let data = req.body
//         let {month, year } = data

//         let compensatoryOffAct
//         const compensatoryOffLeaveAct = await moduleActivation('compensatory_off_leave', db)
//         const compensatoryOffPaidAct = await moduleActivation('compensatory_off_paid', db)
//         if (compensatoryOffLeaveAct == 'yes' || compensatoryOffPaidAct == 'yes') {
//             compensatoryOffAct = 'yes'
//         }
//         else {
//             compensatoryOffAct = 'no'
//         }

       
//         let subCompanyId = (req.body.subCompanyId || null)
//         let empCode = (req.body.empCode || null)
//         let empName = (req.body.empName || null)
//         let branchId = (req.body.branchId || null)
//         let deptId = (req.body.deptId || null)
//         let designId = (req.body.designId || null)
//         let subDepartmentId = (req.body.subDepartmentId || null)
//         let location = (req.body.location || null)
//         let empType = (req.body.empType || null)
//         let category = (req.body.category || null)
//         let userrole=req.body.userrole

//         // if (!userrole) {
//         //     return res.status(400).json({ status: false, msg: 'plz enter userrole' })
//         // }

//         if(userrole==='hr' ||!userrole){

//             let countQuery = await db.query(`

//                 SELECT COUNT(*) AS total FROM eve_acc_employee AS emp
//                  WHERE emp.status = 'A'
//                  AND emp.employeeType='Blue Collar'
//                  AND (
//                      :empName IS NULL OR emp.employeeName=:empName
//                      )
//                  AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId = :subCompanyId) 
//                  AND (:empCode IS NULL OR emp.employeeCode = :empCode) 
//                  AND (:branchId IS NULL OR emp.employeeBranchId=:branchId)
//                  AND (:deptId IS NULL OR emp.employeeDepartmentId = :deptId)
//                  AND (:designId IS NULL OR emp.employeeDesignationId = :designId)
//                  AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId = :subDepartmentId)
//                  AND (:location IS NULL OR emp.locationID = :location)
//                  AND (employeeCurrentStatus = '' 
//                  OR employeeCurrentStatus IS NULL 
//                  OR employeeCurrentStatus = 'Active'
//                  OR employeeCurrentStatus = 'resignation' 
//                  OR employeeCurrentStatus = 'joining'
//                  OR employeeCurrentStatus = 'termination'
//                  OR employeeCurrentStatus = 'release' 
//                  OR employeeCurrentStatus = 'offerletter')
//                  AND DATE_FORMAT(emp.employeeDoj, "%Y-%m") <= :yearMonth
//                    AND (DATE_FORMAT(employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR employeeLastWorkingDate IS NULL )

//                      AND (:empType IS NULL OR   emp.empTypeId=:empType)
//                      AND (:category IS NULL OR   emp.employeeType=:category)
                 
//                  `,
//                      {
//                          replacements:
//                          {
//                             subCompanyId: subCompanyId,
//                             empCode: empCode,
//                             empName: empName,
//                             branchId: branchId,
//                             deptId: deptId,
//                             designId: designId,
//                             subDepartmentId: subDepartmentId,
//                             location: location,
//                             empType: empType,
//                             category: category,
//                             yearMonth: year + '-' + month
         
         
//                          },
//                          type: QueryTypes.SELECT
//                      }
//                  );
//                  totalData = countQuery[0].total;
//                  limit = parseInt(req.body.limit) || totalData;
//                  let maxPage = Math.ceil(totalData / limit)
//                  pageNo = parseInt(req.body.pageNo) || 1;
//                  pageNo = pageNo <= maxPage ? pageNo : maxPage
//                  let offset = (pageNo - 1) * limit;
         
//                  if (totalData == 0) {
//                      return res.status(200).send({ status: false, msg: "no data found", totalData: 0, employee: [] })
//                  }
         
               
         
         
             
         
//                  if (!(month && year)) {
//                      return res.status(400).send({ status: false, msg: 'enter year and month' })
//                  }
         
         
//                  getData = await db.query(`

//                   SELECT 
//                      slno, 
//                      empId, 
//                      empName, 
//                      empCode, 
//                      branchName, 
//                      branchId, 
//                      subCompanyName, 
//                      subCompanyId, 
//                      departmentName, 
//                      deptId, 
//                      designName, 
//                      designId, 
//                      subDepartmentName, 
//                      subDepartmentId, 
//                      location, 
//                      category, 
//                      locationName,
//                       empTypeId

//                  FROM (
//                      SELECT 
//                          @row_number:=@row_number + 1 AS slno,
//                          emp.id AS empId,
//                          emp.employeeName AS empName,
//                          emp.employeeCode AS empCode,
//                          emp.employeeBranchId AS branchName,
//                          emp.employeeBranchId AS branchId,
//                          emp.employeeSubCompanyId AS subCompanyName,
//                          emp.employeeSubCompanyId AS subCompanyId,
//                          emp.employeeDepartmentId AS departmentName,
//                          emp.employeeDepartmentId AS deptId,
//                          emp.employeeDesignationId AS designName,
//                          emp.employeeDesignationId AS designId,
//                          emp.employeeSubDepartmentId AS subDepartmentName,
//                          emp.employeeSubDepartmentId AS subDepartmentId,
//                          emp.locationID AS location,
//                          emp.employeeType AS category,
//                          eve_acc_locationmaster.location AS locationName,
//                          emp.empTypeId 
//                      FROM
//                          eve_acc_employee AS emp
//                      LEFT JOIN
//                          eve_acc_locationmaster ON emp.locationID = eve_acc_locationmaster.id
//                      CROSS JOIN
//                          (SELECT @row_number := :offset) AS init
//                      WHERE
//                          (emp.status = 'A')

//                            AND emp.employeeType='Blue Collar'

//                          AND (:empName IS NULL OR emp.employeeName = :empName)
//                          AND (:subCompanyId IS NULL OR emp.employeeSubCompanyId = :subCompanyId)
//                          AND (:empCode IS NULL OR emp.employeeCode = :empCode)
//                          AND (:branchId IS NULL OR emp.employeeBranchId = :branchId)
//                          AND (:deptId IS NULL OR emp.employeeDepartmentId = :deptId)
//                          AND (:designId IS NULL OR emp.employeeDesignationId = :designId)
//                          AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId = :subDepartmentId)

//                          AND (:location IS NULL OR emp.locationID = :location)

//                          AND (
//                              emp.employeeCurrentStatus = '' 
//                              OR emp.employeeCurrentStatus IS NULL 
//                              OR emp.employeeCurrentStatus = 'Active'
//                              OR emp.employeeCurrentStatus = 'resignation' 
//                              OR emp.employeeCurrentStatus = 'joining'
//                              OR emp.employeeCurrentStatus = 'termination'
//                              OR emp.employeeCurrentStatus = 'release' 
//                              OR emp.employeeCurrentStatus = 'offerletter'
//                          )
//                          AND DATE_FORMAT(emp.employeeDoj, "%Y-%m") <= :yearMonth
//                            AND (DATE_FORMAT(emp.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR emp.employeeLastWorkingDate IS NULL )

//                             AND (:empType IS NULL OR   emp.empTypeId=:empType)
//                      AND (:category IS NULL OR   emp.employeeType=:category)

//                      ORDER BY
//                          emp.employeeName
//                      LIMIT :limit
//                      OFFSET :offset
//                  ) AS sub
//                  ORDER BY slno

//              `, {
//                      replacements: {
//                         limit: limit,
//                          offset: offset,
//                          subCompanyId: subCompanyId,
//                          empCode: empCode,
//                          empName: empName,
//                          branchId: branchId,
//                          deptId: deptId,
//                          designId: designId,
//                          subDepartmentId: subDepartmentId,
//                          location: location,
//                          empType: empType,
//                          category: category,
//                          yearMonth: year + '-' + month
//                      },
//                      type: QueryTypes.SELECT
//                  });
//         }
//         else if(userrole==='supervisor'){
//             let countQuery = await db.query(`

//                  SELECT COUNT(*) AS total 

//                 FROM eve_acc_employee AS a
//                  RIGHT JOIN eve_acc_employee_attendance_reporting_system AS b ON a.id = b.empId
//                  WHERE a.status = 'A'

//                  AND a.employeeType='Blue Collar'

//                  AND (
//                      :empName IS NULL OR a.employeeName=:empName
//                      )
//                  AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId) 
//                  AND (:empCode IS NULL OR a.employeeCode = :empCode) 
//                  AND (:branchId IS NULL OR a.employeeBranchId=:branchId)
//                  AND (:deptId IS NULL OR a.employeeDepartmentId = :deptId)
//                  AND (:designId IS NULL OR a.employeeDesignationId = :designId)
//                  AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId = :subDepartmentId)
//                  AND (:location IS NULL OR a.locationID = :location)

//                   AND (:empType IS NULL OR   a.empTypeId=:empType)

//                    AND (:category IS NULL OR   a.employeeType=:category)

//                  AND (a.employeeCurrentStatus = '' 
//                  OR a.employeeCurrentStatus IS NULL 
//                  OR a.employeeCurrentStatus = 'Active'
//                  OR a.employeeCurrentStatus = 'resignation' 
//                  OR a.employeeCurrentStatus = 'joining'
//                  OR a.employeeCurrentStatus = 'termination'
//                  OR a.employeeCurrentStatus = 'release' 
//                  OR a.employeeCurrentStatus = 'offerletter')

//                  AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth
//                   AND (DATE_FORMAT(a.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR a.employeeLastWorkingDate IS NULL )

//                    AND (
//             b.appriserId = :userId 
//             OR b.reviewerId = :userId 
//             OR b.managerId = :userId
//         )
                 
//                  `,
//                      {
//                          replacements:
//                          {
//                             subCompanyId: subCompanyId,
//                             empCode: empCode,
//                             empName: empName,
//                             branchId: branchId,
//                             deptId: deptId,
//                             designId: designId,
//                             subDepartmentId: subDepartmentId,
//                             location: location,
//                             empType: empType,
//                             category: category,
//                             yearMonth: year + '-' + month,
//                             userId:tokenUserId,
         
         
//                          },
//                          type: QueryTypes.SELECT
//                      }
//                  );
//                  totalData = countQuery[0].total;
//                  limit = parseInt(req.body.limit) || totalData;
//                  let maxPage = Math.ceil(totalData / limit)
//                  pageNo = parseInt(req.body.pageNo) || 1;
//                  pageNo = pageNo <= maxPage ? pageNo : maxPage
//                  let offset = (pageNo - 1) * limit;
         
//                  if (totalData == 0) {
//                      return res.status(200).send({ status: false, msg: "no data found", totalData: 0, employee: [] })
//                  }
         
               
         
         
             
         
//                  if (!(month && year)) {
//                      return res.status(400).send({ status: false, msg: 'enter year and month' })
//                  }
         
         
//                  getData = await db.query(`
//                     SELECT 
//                         (@row_number := @row_number + 1) AS slno, 
//                         empId, 
//                         empName, 
//                         empCode, 
//                         branchName, 
//                         branchId, 
//                         subCompanyName, 
//                         subCompanyId, 
//                         departmentName, 
//                         deptId, 
//                         designName, 
//                         designId, 
//                         subDepartmentName, 
//                         subDepartmentId, 
//                         location, 
//                         category, 
//                         locationName,
//                         empTypeId

//                     FROM (
//                         SELECT 
//                             a.id AS empId,
//                             a.employeeName AS empName,
//                             a.employeeCode AS empCode,
//                             a.employeeBranchId AS branchName,
//                             a.employeeBranchId AS branchId,
//                             a.employeeSubCompanyId AS subCompanyName,
//                             a.employeeSubCompanyId AS subCompanyId,
//                             a.employeeDepartmentId AS departmentName,
//                             a.employeeDepartmentId AS deptId,
//                             a.employeeDesignationId AS designName,
//                             a.employeeDesignationId AS designId,
//                             a.employeeSubDepartmentId AS subDepartmentName,
//                             a.employeeSubDepartmentId AS subDepartmentId,
//                             a.locationID AS location,
//                             a.employeeType AS category,
//                             eve_acc_locationmaster.location AS locationName,
//                             a.empTypeId 
//                         FROM eve_acc_employee AS a
//                         RIGHT JOIN eve_acc_employee_attendance_reporting_system AS b ON a.id = b.empId
//                         LEFT JOIN eve_acc_locationmaster ON a.locationID = eve_acc_locationmaster.id
//                         WHERE
//                             a.status = 'A'

//                                AND a.employeeType='Blue Collar'
                               
//                             AND (:empName IS NULL OR a.employeeName = :empName)
//                             AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
//                             AND (:empCode IS NULL OR a.employeeCode = :empCode)
//                             AND (:branchId IS NULL OR a.employeeBranchId = :branchId)
//                             AND (:deptId IS NULL OR a.employeeDepartmentId = :deptId)
//                             AND (:designId IS NULL OR a.employeeDesignationId = :designId)
//                             AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId = :subDepartmentId)
//                             AND (:location IS NULL OR a.locationID = :location)

//                              AND (:empType IS NULL OR   a.empTypeId=:empType)

//                                AND (:category IS NULL OR   a.employeeType=:category)

//                             AND (
//                                 a.employeeCurrentStatus = '' 
//                                 OR a.employeeCurrentStatus IS NULL 
//                                 OR a.employeeCurrentStatus = 'Active'
//                                 OR a.employeeCurrentStatus = 'resignation' 
//                                 OR a.employeeCurrentStatus = 'joining'
//                                 OR a.employeeCurrentStatus = 'termination'
//                                 OR a.employeeCurrentStatus = 'release' 
//                                 OR a.employeeCurrentStatus = 'offerletter'
//                             )
//                             AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth
//                           AND (DATE_FORMAT(a.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR a.employeeLastWorkingDate IS NULL )
//                             AND (
//                                 b.appriserId = :userId 
//                                 OR b.reviewerId = :userId 
//                                 OR b.managerId = :userId
//                             )
//                         ORDER BY a.employeeName
//                     ) AS sub
//                     CROSS JOIN (SELECT @row_number := 0) AS init
//                     ORDER BY slno
//                     LIMIT :limit OFFSET :offset
//                 `, {
//                     replacements: {
//                         limit: limit,
//                         offset: offset,
//                         subCompanyId: subCompanyId,
//                         empCode: empCode,
//                         empName: empName,
//                         branchId: branchId,
//                         deptId: deptId,
//                         designId: designId,
//                         subDepartmentId: subDepartmentId,
//                         location: location,
//                         empType: empType,
//                         category: category,
//                         yearMonth: year + '-' + month,
//                         userId: tokenUserId,
//                     },
//                     type: QueryTypes.SELECT
//                 });
                
                
//         }

//         let totalWork
//         let totalActualShift
//         let timeArr = []
//         let shiftArr = []

//         await Promise.all(getData.map(async (e) => {

//             e.status='Pending'


//             if (e.branchName != null && e.branchName != '') {
//                 e.branchName = await getBranchNameByBranchId(e.branchName, db)
//             }
//             if(!e.branchName){
//                 e.branchName=''
//             }
//             if (e.subCompanyName != null && e.subCompanyName != '') {
//                 e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)
//             }
//             if (e.subCompanyName == null) {
//                 e.subCompanyName = ''
//             }
//             e.empName=e.empName===null?'':e.empName
//             if (e.subCompanyId == null) {
//                 e.subCompanyId = ''
//             }
//             if (e.designName != null && e.designName != '') {
//                 e.designName = await getDesignationNameById(e.designName, db)
//             }
//             if (e.designName == null) {
//                 e.designName = ''
//             }
//             if (e.departmentName != null && e.departmentName != '') {
//                 e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)
//             }
//             if (e.departmentName == null) {
//                 e.departmentName = ''
//             }
//             if (e.subDepartmentName != null && e.subDepartmentName != '') {
//                 e.subDepartmentName = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentName, db)
//             }
//             if (e.subDepartmentName == null) {
//                 e.subDepartmentName = ''
//             }
//             if (e.subCompanyId != null) {

//                 e.subCompanyId = e.subCompanyId.toString()
//             }
//             if (e.employeeType == null) {
//                 e.employeeType = String
//             }
//             // if(e.location==null){
//             //     e.location=''
//             // }
//             // e.empCode=(e.empCode=null)?e.empCode='':
//             // e.branchName
//             if (e.locationName == null) {
//                 e.locationName = ''
//             }
//             e.location = (e.location === null) ? '' : e.location;
//             e.empCode = (e.empCode === null) ? '' : e.empCode;
//             e.branchName = (e.branchName === null) ? '' : e.branchName;
//             e.type = await myFunc.getEmpTypeName(e.empTypeId, db)
            
            
//             // e.actualShiftHours = ''
//             const empRoasterModel = await db.query(
//                 `
//                 SELECT
//                 a.shiftId,
//                 b.clockInTime,
//                 b.clockOutTime,
//                 b.minWorkingHour,
//                 b.minWorkingHourMin

//                 FROM eve_hrm_employee_roaster AS a
//                 LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id 
//                 WHERE a.status='A'
//                 AND employeeId=:empId

            

//                 -- AND DATE_FORMAT(a.fromDate,'%d-%m-%Y') <= :date
//                 -- AND DATE_FORMAT(a.toDate,'%d-%m-%Y') >= :date 

//                  AND YEAR(fromDate)=:year
//                  AND MONTH(fromDate)=:month
            
    
//                 `,
//                 {
//                     replacements: {
//                         empId: e.empId,
//                         year: year,
//                        month: month,
//                     },
//                     type: QueryTypes.SELECT
//                 }
//             )




//             if (empRoasterModel.length > 0 && empRoasterModel[0]['minWorkingHour'] !== null && empRoasterModel[0]['minWorkingHourMin'] !== null) {
//                 e.actualShiftHours = `${(empRoasterModel[0]['minWorkingHour'])}:${(empRoasterModel[0]['minWorkingHourMin'])}`
//                 shiftArr.push(e.actualShiftHours)
//             }
//             else {
//                 const empShiftModel = await db.query(
//                     `
//                     SELECT a.shiftId,b.minWorkingHour,b.minWorkingHourMin 
//                     FROM eve_hrm_employee_details AS a
//                     LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id  
//                     WHERE a.status='A'
//                     AND employeeId=:empId 
//                     `, {
//                     replacements: {
//                         empId: e.empId

//                     }, type: QueryTypes.SELECT
//                 }
//                 )


//                 if (empShiftModel.length > 0 && empShiftModel[0]['minWorkingHour'] !== null && empShiftModel[0]['minWorkingHourMin'] !== null) {

//                     e.actualShiftHours = `${(empShiftModel[0]['minWorkingHour'])}:${(empShiftModel[0]['minWorkingHourMin'])}`
//                     shiftArr.push(e.actualShiftHours)
//                 }
//                 else {
//                     e.actualShiftHours = ''
//                 }
//             }
            








//         }))
//         /************************************************************************************** */
//         //Case==creditSetting of employees



//         let eve_self_registration = await db.query('select * from  eve_self_registration where status="A"', {
//             type: QueryTypes.SELECT
//         })

//         for (let i = 0; i < getData.length; i++) {
//             for (let j = 0; j < eve_self_registration.length; j++) {
//                 if (getData[i].empId == eve_self_registration[j].empId && month == eve_self_registration[j].mm && year == eve_self_registration[j].yyyy) {
//                     getData[i].creditSetting = [{
//                         creditDay: eve_self_registration[j].creadit_month,
//                         creditUsed: eve_self_registration[j].used,
//                         employeeId: eve_self_registration[j].empId
//                     }]
//                 }
//             }
//         }

//         /******************************************************************************** */


//         getData = getData.map((value) => {
//             value.compOff = []
//             return value
//         })
//         getData = getData.map((value) => {
//             value.holidayArr = []
//             return value
//         })
//         getData = getData.map((value) => {
//             value.inOutArr = []
//             return value
//         })

//         //***********************************************************************//

//         //Case=EarningSalary

//         //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise



//         getData = getData.map((value) => {
//             value.earningSalary = 0
//             return value
//         })

//         //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise
//         let monthlySalaryDb = await db.query('select * from eve_acc_set_monthly_salary_employee_wise where status="A"', {
//             type: QueryTypes.SELECT
//         })

//         let extra_duty_off_paid = await db.query('select * from  eve_acc_module_activation_master where status="A" && name=:name', {
//             replacements: {
//                 name: "extra_duty_off_paid"
//             },
//             type: QueryTypes.SELECT
//         })

//         for (let i = 0; i < getData.length; i++) {

//             for (let j = 0; j < monthlySalaryDb.length; j++) {



//                 if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'addition') {

//                     getData[i].earningSalary += (parseFloat(monthlySalaryDb[j].salaryAmount))


//                 }
//                 else if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'deduction') {
//                     getData[i].earningSalary -= (parseFloat(monthlySalaryDb[j].salaryAmount))



//                 }
//             }
//         }


//         //extraDutyEmpById

//         let totalDaysOfMOnth = getDaysInMonth(year, month);
//         let startDate = `${year}-${month}-01`

//         let endDate = `${year}-${month}-${totalDaysOfMOnth}`


//         let totalCompOffDays = 0
//         for (let i = 0; i < getData.length; i++) {
//             getData[i].Amount = formatAmount((getData[i].earningSalary) / totalDaysOfMOnth)
//             // getData[i].Amount = ((getData[i].earningSalary)/totalDaysOfMOnth)

//             getData[i].earningSalary = formatAmount(getData[i].earningSalary)
//             // getData[i].earningSalary = (getData[i].earningSalary)


//         }

//         if ((extra_duty_off_paid.length) > 0) {


//             let eve_acc_extra_duty_encashment_calculation_setting = await db.query('select * from eve_acc_extra_duty_encashment_calculation_setting where status="A"', {
//                 type: QueryTypes.SELECT
//             })

//             let extraDuty = eve_acc_extra_duty_encashment_calculation_setting



//             let tempSalaryAmount = 0

//             for (let i = 0; i < extraDuty.length; i++) {
//                 for (let j = 0; j < monthlySalaryDb.length; j++) {

//                     if (extraDuty[i].salaryTemplateId == monthlySalaryDb[j].salaryTempId && extraDuty[i].salaryComponents) {

//                     }
//                 }
//             }


//         }

//         //fixedWeeklyHoliday

//         getData = getData.map((value) => {
//             value.fixedWeeklyOffDay = ''
//             return value
//         })

//         let fixedWeeklyHolidayDb = await db.query('select * from eve_acc_company_fix_weekly_holiday where status="A"', {
//             type: QueryTypes.SELECT
//         })



//         for (let i = 0; i < getData.length; i++) {
//             for (let j = 0; j < fixedWeeklyHolidayDb.length; j++) {


//                 if (getData[i].branchId == fixedWeeklyHolidayDb[j].branchId) {
//                     getData[i].fixedWeeklyOffDay = fixedWeeklyHolidayDb[j].day
//                 }

//             }
//         }

//         //******************************************************************//
//         //additionalWeeklyOffDay

//         function weeklyHolidayArrayFn(options) {

//             let days = ['sunday', 'monday', 'tuesday', "wednesday", "thursday", 'friday', 'saturday']

//             let { month, year, dayName, dayNoStr } = options
//             let date = moment(`${year}-${month}-01`)
//             // console.log(date);
//             let dayIndex = days.indexOf(dayName)
//             let currentDay = date.format('dddd').toLowerCase()
//             let currentDayIndex = days.indexOf(currentDay)
//             let firstDayNo = '01'

//             if (dayIndex > currentDayIndex) {

//                 firstDayNo = (dayIndex - currentDayIndex) + 1

//             }
//             else if (dayIndex < currentDayIndex) {

//                 let diffAfterCurrentDay = (days.length) - (currentDayIndex)
//                 let diffBeforeDay = dayIndex + 1
//                 firstDayNo = diffAfterCurrentDay + diffBeforeDay
//             }

//             else if (dayIndex == currentDayIndex) {
//                 firstDayNo = 1
//             }

//             let dayNo = dayNoStr.toString().replace(/(?![0-9])./g, '') * 1
//             if (dayNo > 1) {

//                 firstDayNo += (7 * (dayNo - 1))

//             }
//             // return firstDayNo
//             return (firstDayNo < 10 ? `0${firstDayNo}` : `${firstDayNo}`)
//         }


//         getData = getData.map((value) => {
//             value.additionalWeeklyOffDay = {
//                 day: null,
//                 weeklyHolidayArray: []
//             }
//             return value
//         })


//         let companyWeeklyHolidayDb = await db.query('select * from eve_acc_company_weekly_holiday where status="A"', { type: QueryTypes.SELECT })


//         for (let i = 0; i < getData.length; i++) {

//             for (let j = 0; j < companyWeeklyHolidayDb.length; j++) {

//                 if (getData[i].branchId == companyWeeklyHolidayDb[j].branchId) {

//                     let options = {
//                         month: month,
//                         year: year,
//                         dayName: companyWeeklyHolidayDb[j].day.toLowerCase(),
//                     }

//                     getData[i].additionalWeeklyOffDay.day = companyWeeklyHolidayDb[j].day
//                     if (typeof (companyWeeklyHolidayDb[j].weeks) == "string" && companyWeeklyHolidayDb[j].weeks !== "null") {
//                         let weeksArray = companyWeeklyHolidayDb[j].weeks.split(',')


//                         for (let k = 0; k < weeksArray.length; k++) {

//                             options.dayNoStr = weeksArray[k]
//                             getData[i].additionalWeeklyOffDay.weeklyHolidayArray.push(weeklyHolidayArrayFn(options))

//                         }
//                     }
//                 }
//             }
//         }
//         //****************************************************************************//


//         getData = getData.map((value) => {
//             value.empId = value.empId.toString()
//             return value
//         })

//         getData = getData.map((value) => {
//             value.base64_empId = Buffer.from(value.empId || '').toString('base64')
//             return value
//         })

//         //sandwich_leave


//         let sandwich_leave = await db.query('select * from eve_acc_module_activation_master where status="A" && name="sandwich_leave"', { type: QueryTypes.SELECT })

//         //appDetails

//         function getDaysInMonth(year, month) {
//             return new Date(year, month, 0).getDate();
//         }

//         const daysInCurrentMonth = getDaysInMonth(year, month);

//         let NoOfdaysInMonth = parseInt(daysInCurrentMonth)


//         getData = getData.map((value) => {
//             value.totalDays = NoOfdaysInMonth
//             return value
//         })


//         let employeeAttendance = await db.query('select * from eve_acc_employee_attendence where status="A"', {
//             type: QueryTypes.SELECT
//         })

//         const appDetailsObj = [];

//         for (let i = 1; i <= NoOfdaysInMonth; i++) {
//             let number = i.toString().padStart(2, '0');
//             // console.log(number);
//             let empDtStrdate = new Date(`${year}-${month}-${number}`);

//             let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

//             let newObj = {
//                 crtDate: `${year}-${month}-${number}`,
//                 intime: "--",
//                 outTime: "--",
//                 workingHour: "--",
//                 attStatus: "--",
//                 empDtStr: `${timestamp}`,
//                 backcolor: "--",
//                 title: "--"
//             };


//             appDetailsObj.push(newObj);
//         }

//         let employeeAttendanceApproved = await db.query('select * from eve_acc_employee_attendence_approved where status="A" ', {
//             type: QueryTypes.SELECT
//         })

//         let eve_acc_company_holiday = await db.query('select * from eve_acc_company_holiday where status="A" ', {
//             type: QueryTypes.SELECT
//         })

    

//          getData.map((value) => {
//             value.totalFullDay = 0
//             value.totalPresentDay = 0
//             value.totalAbsent = 0
//             value.totalHalfDay = 0
//             value.totalReject = 0
//             value.totalRejectedSunday = 0
//             value.totalPaidLeave = 0
//             value.totalUnpaidLeave = 0
//             value.totalHalfdayPaidLeave = 0
//             value.totalHalfdayPaidLeave = 0
//             value.totalHalfdayunpaidLeave = 0
//             value.totalMarkedAsHoliday = 0
//             value.totalWorkingHour = 0
//             value.totalPaidHoliday = 0
//             // return value
//         })

//         for (let i = 0; i < getData.length; i++) {

//             let statusArray=[]

//             let value = getData[i]

//             let _appDetailsObj = JSON.parse(JSON.stringify(appDetailsObj))


//             let employeeAttendanceId = employeeAttendance.filter((x) => {
//                 return value.empId == x.empId
//             })
//             let empAttendanceIdOfApproved = employeeAttendanceApproved.filter((x) => {
//                 return value.empId == x.employeeId
//             })
//             /************************************************** */
//             let employeeBranchId = eve_acc_company_holiday.filter((x) => {
//                 if(value.branchId==x.branchId){
//                     return true
//                 }
//                 // return value.branchId = x.branchId
//             })

//             // console.log(employeeBranchId);

//             /*****************************************/

//             for (let j = 0; j < _appDetailsObj.length; j++) {
//                 let _appDetail = _appDetailsObj[j]

//                 let targetObj = employeeAttendanceId.find((e) => {
//                     return (e.empId == value.empId && _appDetail.crtDate == e.date)
//                 })
//                 let targetObjOfApproved = empAttendanceIdOfApproved.find((e) => {
//                     return (e.employeeId == value.empId && _appDetail.crtDate == e.date)
//                 })

//                 let targetObjOfCompanyHoliday = employeeBranchId.find((e) => {
//                     return (e.branchId == value.branchId && _appDetail.crtDate == e.date)
//                 })


//                 if (targetObj) {
//                     if(targetObj.intime!=null){

//                         _appDetail.intime = targetObj.intime
//                     }
//                     if(targetObj.outTime!=null){

//                         _appDetail.outTime = targetObj.outTime
//                     }

//                     if (targetObj.intime != "--:undefined") {
//                         _appDetail.intime = targetObj.intime
//                     }

//                     if (targetObj.outTime != "--:undefined") {
//                         _appDetail.outTime = targetObj.outTime
//                     }
//                     if (targetObj.intime == '') {
//                         _appDetail.intime = '--'
//                     }
//                     if (targetObj.outTime == '') {
//                         _appDetail.outTime = '--'
//                     }


//                     //inOutArr

//                     if (targetObj.intime != null && targetObj.outTime != null && targetObj.intime != '' && targetObj.outTime != '') {
//                         getData[i].inOutArr.push({
//                             date: _appDetail.crtDate,
//                             inTime: targetObj.intime,
//                             outTime: targetObj.outTime,
//                             intimeStatus: '0',
//                             outtimeStatus: '0',
//                             workingHourInMin: ''

//                         })


//                     }

//                     const time1 = targetObj.outTime
//                     const time2 = targetObj.intime

//                     const timeMoment1 = moment(time1, "HH:mm");
//                     const timeMoment2 = moment(time2, "HH:mm");
//                     const hour1 = timeMoment1.hour();
//                     const hour2 = timeMoment2.hour();


//                     if(hour1>hour2){
//                     const duration = moment.duration(moment(time1, 'HH:mm').diff(moment(time2, 'HH:mm')));

//                     let differenceHours = duration.hours();

//                     let differenceMinutes = duration.minutes();


//                     if (differenceHours < 10) {
//                         differenceHours = `0${differenceHours}`
//                     }

//                     if (differenceMinutes < 10) {
//                         differenceMinutes = `0${differenceMinutes}`
//                     }
//                     if (_appDetail.intime && _appDetail.outTime != ":" && _appDetail.outTime) {

//                         _appDetail.workingHour = `${differenceHours}:${differenceMinutes}`
//                     }
//                 }
//             }

//                 if ((targetObjOfApproved) && (sandwich_leave.length > 0)) {
//                     if (targetObjOfApproved.type == "full") {
//                         _appDetail.backcolor = "#a4eab0"
//                         _appDetail.title = "Present";
//                         _appDetail.attStatus = "Fullday"
//                         getData[i].totalFullDay++
//                         getData[i].totalPresentDay++
//                         statusArray.push( _appDetail.title)

//                     }



//                     else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks != "AB LEAVE" && targetObjOfApproved.remarks != "First Half" && targetObjOfApproved.remark != "Second Half") {
//                         _appDetail.attStatus = "Absent"
//                         _appDetail.backcolor = "#f1bcbc"
//                         _appDetail.title = "Absent";
//                         getData[i].totalReject++
//                         getData[i].totalAbsent++
//                         statusArray.push( _appDetail.title)
//                     }




//                     else if (targetObjOfApproved.type == "half") {
//                         _appDetail.attStatus = "Halfday"
//                         _appDetail.backcolor = "#b1b82c"
//                         _appDetail.title = "Halfday";
//                         getData[i].totalHalfDay++
//                         statusArray.push( _appDetail.title)

//                     }




//                     else if (targetObjOfApproved.leaveTypeId && targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'L LEAVE' && targetObjOfApproved.leaveTypeId != '') {


//                         let leaveResult = await leaveType(targetObjOfApproved.leaveTypeId,db)

//                         _appDetail.backcolor = leaveResult.colorCode
//                         _appDetail.title = leaveResult.name
//                         _appDetail.attStatus = leaveResult.prefix

//                         statusArray.push( _appDetail.title)

//                         getData[i].totalPaidLeave++

//                         if (targetObjOfApproved.flagRemarks == "ForLateClockIn") {
//                             _appDetail.title = " For Late ClockIn";
//                             _appDetail.lateClockIn = "Leave Deducted For Late ClockIn"

//                             statusArray.push( _appDetail.title)

//                         }

//                     }




//                     else if (targetObjOfApproved.type == "holiday" && targetObjOfApproved.remarks == "L LEAVE" && targetObjOfApproved.leaveTypeId == '') {
//                         _appDetail.attStatus = "D-PL"
//                         _appDetail.backcolor = "#85eaea"
//                         _appDetail.title = "Default Paid Leave";

//                         statusArray.push( _appDetail.title)
//                         getData[i].totalPaidLeave++
//                     }





//                     else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks == "AB LEAVE") {
//                         _appDetail.attStatus = "UL"
//                         _appDetail.backcolor = "#f17171"
//                         _appDetail.title = "Unpaid Leave";

//                         statusArray.push( _appDetail.title)
//                         getData[i].totalUnpaidLeave++
//                     }



//                     else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
//                         _appDetail.attStatus = 'HD-PL'
//                         _appDetail.backcolor = '#ffa742'
//                         _appDetail.title = 'Halfday Paid Leave';

//                         statusArray.push( _appDetail.title)
//                         getData[i].totalHalfdayPaidLeave++;
//                     }




//                     else if (targetObjOfApproved.type == 'reject' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
//                         _appDetail.attStatus = 'HD-UL'
//                         _appDetail.backcolor = '#b0f320'
//                         _appDetail.title = 'Halfday unpaid Leave';

//                         statusArray.push( _appDetail.title)
//                         getData[i].totalHalfdayunpaidLeave++;
//                     }



//                     else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks != 'L LEAVE' && targetObjOfApproved.remarks != 'First Half' && targetObjOfApproved.remarks != 'Second Half') {
//                         _appDetail.attStatus = 'Marked as Holiday'
//                         _appDetail.backcolor = '#ccffcc'
//                         _appDetail.title = 'Marked as Holiday';

//                         statusArray.push( _appDetail.title)
//                         getData[i].totalMarkedAsHoliday++
//                     }




//                     else if (targetObjOfApproved.type == "sunday reject") {
//                         _appDetail.attStatus = "Absent"
//                         _appDetail.backcolor = "#f1bcbc"
//                         _appDetail.title = "Absent";

//                         statusArray.push( _appDetail.title)
//                         getData[i].totalReject++
//                         getData[i].totalAbsent++
//                     }


//                 }

//                 /***********************************************************/

//                 else {

//                     _appDetail.attStatus = "-";
//                     _appDetail.backcolor = "#fff";
//                     _appDetail.title = "";
//                     statusArray.push( _appDetail.title)

//                     if (targetObjOfCompanyHoliday) {
//                         _appDetail.backcolor = "#09ff00";

//                         // getData[i].totalHoliDay++
//                         getData[i].totalPaidHoliday++



//                     }

//                     else if (moment(_appDetail.crtDate).format('dddd') == getData[i].fixedWeeklyOffDay) {
//                         _appDetail.attStatus = "Off Day";
//                         _appDetail.backcolor = "#e8e4e4";
//                         _appDetail.title = "Off Day";

//                         statusArray.push( _appDetail.title)

//                         // getData[i].totalOffDay++
//                         getData[i].totalPaidHoliday++
//                     }

//                     else if (
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[0]
//                         ||
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[1]
//                         ||
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[2]
//                         ||
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[3]
//                         ||
//                         moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[4]

//                     ) {
//                         _appDetail.attStatus = "Off Day";
//                         _appDetail.backcolor = "#e8e4e4";
//                         _appDetail.title = "Off Day";

//                         statusArray.push( _appDetail.title)
//                         // getData[i].totalOffDay++
//                         getData[i].totalPaidHoliday++

//                     }
//                 }
//                 value.appDetails = _appDetailsObj


//             }
//             let isAllHalfday = statusArray.length === NoOfdaysInMonth && statusArray.every(value => value === 'Halfday');
        
//             if(isAllHalfday){
//                 value.status='Half Day Approved'
//             }

//             let isAllPresent = statusArray.length === NoOfdaysInMonth && statusArray.every(value => value === 'Present');
           
//             if(isAllPresent){
//                 value.status='Full Day Approved'
//             }

//         }

//         // TotalWorkingHours
//         let formattedHours
//         let formattedMinutes

//         for (let i = 0; i < getData.length; i++) {
//             let value = []
//             for (let j = 0; j < NoOfdaysInMonth; j++) {
//                 if (getData[i].appDetails[j].workingHour != '--') {
//                     value.push(getData[i].appDetails[j].workingHour)
//                 }
//             }
//             // console.log(value);
//             const totalMinutes = value.reduce((sum, time) => {
//                 const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]
//                 return sum + hours * 60 + minutes;
//             }, 0);

//             const hours = Math.floor(totalMinutes / 60)
//             const minutes = totalMinutes % 60;
//             formattedHours = String(hours).padStart(2, "0");
//             formattedMinutes = String(minutes).padStart(2, "0")

//             getData[i].totalWorkingHour = `${formattedHours}:${formattedMinutes}`;


//         }


//         //workingHour

//         function subtractTime(time1, time2) {
//             // Parse time strings into hour and minute components
//             const [hour1, minute1] = time1.split(':').map(Number);
//             const [hour2, minute2] = time2.split(':').map(Number);

//             // Convert hour and minute components into total minutes
//             const totalMinutes1 = hour1 * 60 + minute1;
//             const totalMinutes2 = hour2 * 60 + minute2;

//             // Subtract the total minutes of the second time from the first time
//             let diffMinutes = totalMinutes1 - totalMinutes2;

//             if (diffMinutes < 0) {
//                 // If the result is negative, assume we are crossing midnight and add 24 hours worth of minutes
//                 diffMinutes += 24 * 60;
//             }

//             // Convert the result back to the "hh:mm" format
//             const diffHours = Math.floor(diffMinutes / 60);
//             const diffMins = diffMinutes % 60;

//             // Add leading zeros for single-digit hours/minutes
//             const formattedDiff = `${String(diffHours).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
//             return formattedDiff;
//         }




//         function convertTimeToMinutes(time) {
//             const [hour, minute] = time.split(':').map(Number);
//             const totalMinutes = hour * 60 + minute;
//             return totalMinutes;
//         }

//         for (let i = 0; i < getData.length; i++) {

//             let n = getData[i].inOutArr.length

//             for (let j = 0; j < n; j++) {

//                 let time1 = getData[i].inOutArr[j].outTime
//                 let time2 = getData[i].inOutArr[j].inTime

//                 getData[i].inOutArr[j].workingHourInMin = subtractTime(time1, time2)
//                 getData[i].inOutArr[j].workingHourInMin = convertTimeToMinutes(getData[i].inOutArr[j].workingHourInMin)



//             }
//         }


//         //NetPaidDays
//         let totalPresent=0
//         let totalHalfDay=0
//         let totalAbsent=0
//         let totalPaidLeave=0
//         let totalUnpaidLeave=0
//         getData.map((e) => {
//             e.NetPaidDays = NoOfdaysInMonth.toString()
//             if (e.branchName == null) {
//                 e.branchName = ''
//             }
//             if (e.empCode == null) {
//                 e.empCode = ''
//             }
//             if (e.deptId == null) {
//                 e.deptId = ''
//             }
//             if (e.designId == null) {
//                 e.designId = ''
//             }
//             if (e.subDepartmentId == null) {
//                 e.subDepartmentId = ''
//             }
//             if (e.location == null) {
//                 e.location = ''
//             }
//             timeArr.push(e.totalWorkingHour)
//             totalPresent+=parseInt(e.totalFullDay)
//             totalHalfDay+=parseInt(e.totalHalfDay)
//             totalAbsent+=parseInt(e.totalAbsent)
//             totalPaidLeave+=parseInt(e.totalPaidLeave)
//             totalUnpaidLeave+=parseInt(e.totalUnpaidLeave)
//         })
//         totalWork = addTimes(timeArr)
//         totalActualShift = addTimes(shiftArr)

//         //count total fixed holiday in a month of employee

//         function countDayInMonth(year, month, targetDay) {

//             const firstDayOfMonth = new Date(year, month - 1, 1);
//             const firstDayOfWeek = firstDayOfMonth.getDay();
//             const daysInMonth = new Date(year, month, 0).getDate();
//             let targetDayCount = 0;
//             const targetDayOfWeek = (targetDay - firstDayOfWeek + 7) % 7;

//             for (let day = 0; day < daysInMonth; day++) {
//                 const currentDayOfWeek = (firstDayOfWeek + day) % 7;
//                 if (currentDayOfWeek === targetDayOfWeek) {

//                     targetDayCount++;
//                 }
//             }
//             return targetDayCount;
//         }
//         let totalSalaryExpenses = 0
//         for (let i = 0; i < getData.length; i++) {
//             getData[i].totalPaidHoliday = (getData[i].totalPaidHoliday) - (getData[i].totalRejectedSunday)
//             if(getData[i].totalPaidHoliday>=10){

//                 getData[i].totalPaidHoliday = `${getData[i].totalPaidHoliday.toString()}`
                                             
//             }
//             else if(getData[i].totalPaidHoliday>=1||getData[i].totalPaidHoliday<=9){

//                 getData[i].totalPaidHoliday = `0${getData[i].totalPaidHoliday.toString()}`
//             }
//             else if(getData[i].totalPaidHoliday==0){
//                 getData[i].totalPaidHoliday = `00`
//             }

//             let e = getData[i]
//             for (let j = 0; j < NoOfdaysInMonth; j++) {

//                 e.appDetails[j].crtDate = moment(e.appDetails[j].crtDate).format("DD/MM/YYYY");
//             }
//         }


      

//         let attendanceReportExcel = getData.map((e, i) => ({
//             'Sl. No.': Number(i + 1),
//             'Worker Name': e.empName,
//             'Worker Code': e.empCode,
//             'Category':e.category,
//             'Type':e.type,
//             'Sub Company': e.subCompanyName,
//             'Branch': e.branchName,
//             'Location': e.locationName,
//             'Department': e.departmentName,
//             'Sub Department': e.subDepartmentName,
//             'Designation':e.designName,
//             'App': e.appDetails,
//             'Total Work Hours': e.totalWorkingHour,
//             'Actual Shift Hours':e.actualShiftHours,
//             'Status':e.status,
//             'Present': e.totalPresentDay,
//             'Half Day': e.totalHalfDay,
//             'Absent': e.totalAbsent,
//             'Paid Leave': e.totalPaidLeave,
//             'Unpaid Leave': e.totalUnpaidLeave,
//         }))

//         return res.status(200).send({
//             recordedPerPage: limit,
//             currentPage: pageNo,
//             totalData: totalData,
         
//             totalSalaryExpenses: totalSalaryExpenses,
//             totalWork: totalWork,
//             totalActualShift: totalActualShift,
//             totalPresent:totalPresent,
//             totalHalfDay:totalHalfDay,
//             totalAbsent:totalAbsent,
//             totalPaidLeave:totalPaidLeave,
//             totalUnpaidLeave:totalUnpaidLeave,
//             // employee: getData,
//             employee: myFunc.replaceEmptyValues(attendanceReportExcel),

//         })
//     }
//     catch (error) {
//         return res.status(500).send({ status: false, msg: error.message })
//     }
// }
// async function fetchData({ token,year, month, userrole,limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location,empType,category }) {
//     try {
//         const config = {
//             headers: { 
//                 'Content-Type': 'application/json',
//                 'x-cross-auth':token
//              },
//             method: 'POST',
//             url: `${process.env.BASE_URL}/report/getmonthlyAttendanceExcel`,
          
//             data: {token,year, month, userrole,limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location,empType,category }
//         }
//         const response = await axios(config)
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// }
// function getColumnLetter(columnNumber) {
//     let columnName = '';
//     while (columnNumber > 0) {
//         let remainder = (columnNumber - 1) % 26;
//         columnName = String.fromCharCode(65 + remainder) + columnName;
//         columnNumber = Math.floor((columnNumber - 1) / 26);
//     }
//     return columnName;
// }


// async function createExcelFile(data) {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Sheet1');
//     let values = []
//     let employee = data.employee
//     let header = Object.keys(employee[0])
//     let subHeader = []
//     let midHeader = []

//     let appIndex = header.indexOf('App')

//     let mergeColumn = []



//     employee[0].App.forEach((e, i) => {
//         midHeader.push(e.crtDate, '', '', '')
//         subHeader.push( 'In Time', 'Out Time', 'Working hr.','Status')

//         let startColumn = (appIndex + 1) + (i * 4)
//         let endColumn = (startColumn + 3)
//         let endRow = 1
//         let startRow = 1
//         mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
//         // worksheet.mergeCells(`${getColumnLetter(startColumn)}2:${getColumnLetter(endColumn)}2`)
//     })

//     // console.log(mergeColumn);

//     header.splice(appIndex, 1, ...midHeader)

//     subHeader.unshift(...new Array(appIndex).fill(''))


//     values.push(header)
//     values.push(subHeader)

//     employee.forEach(e => {
//         let value = Object.values(e)
//         let row = []
//         value.forEach((x, i) => {
//             if (Array.isArray(x)) {
//                 x.forEach((z, k) => {
//                     row.push( z.intime, z.outTime, z.workingHour,z.attStatus)
//                 })
//             }
//             else {
//                 row.push(x)
//             }
//         })


//         values.push(row)

//     });
//    // Assuming 'header' is defined and contains the correct headers

// // Get indices for the required columns
// let totalWorkIndex = header.indexOf('Total Work Hours') + 1; // Add 1 because ExcelJS uses 1-based index
// let totalActualIndex = header.indexOf('Actual Shift Hours') + 1;
// let totalPresent = header.indexOf('Present') + 1;
// let totalHalfDay = header.indexOf('Half Day') + 1;
// let totalAbsent = header.indexOf('Absent') + 1;
// let totalPaidLeave = header.indexOf('Paid Leave') + 1;
// let totalUnpaidLeave = header.indexOf('Unpaid Leave') + 1;
// let status = header.indexOf('Status') + 1;
// let total = header.indexOf('Sl. No.') + 1; // Adjusted as ExcelJS is 1-based

// // Log indices for debugging


// // Prepare data row with appropriate length
// let len = header.length;
// let row = new Array(len).fill('');

// // Assign data values to their respective indices
// row[totalWorkIndex - 1] = data['totalWork']; // Use 0-based for array
// row[totalActualIndex - 1] = data['totalActualShift'];
// row[totalPresent - 1] = data['totalPresent'];
// row[totalHalfDay - 1] = data['totalHalfDay'];
// row[totalAbsent - 1] = data['totalAbsent'];
// row[totalPaidLeave - 1] = data['totalPaidLeave'];
// row[totalUnpaidLeave - 1] = data['totalUnpaidLeave'];
// row[total - 1] = 'TOTAL';

// // Push the row into values array
// values.push(row);

// // Add the values to the worksheet
// worksheet.addRows(values);

// // Merge cells as required
// mergeColumn.forEach((e) => {
//     worksheet.mergeCells(e);
// });

// // Setting cell values using calculated indices
// worksheet.getCell(2, totalWorkIndex).value = '';
// worksheet.getCell(2, totalActualIndex).value = '';
// worksheet.getCell(2, totalPresent).value = '';
// worksheet.getCell(2, totalHalfDay).value = '';
// worksheet.getCell(2, totalAbsent).value = '';
// worksheet.getCell(2, totalPaidLeave).value = '';
// worksheet.getCell(2, totalUnpaidLeave).value = '';
// worksheet.getCell(2, status).value = '';


//     const headerRow = worksheet.getRow(1);
//     const headerRow2 = worksheet.getRow(2);

//     worksheet.eachRow((row) => {
//         row.eachCell((cell) => {
//             cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
//             cell.border = {
//                 top: { style: 'thin' },
//                 left: { style: 'thin' },
//                 bottom: { style: 'thin' },
//                 right: { style: 'thin' },
//               };

//             row.height = 25

//         });
//     });
//     headerRow.eachCell(cell => {
//         // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
//         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
//         cell.font = { bold: true };

//     });
//     headerRow2.eachCell(cell => {
//         // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
//         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
//         cell.font = { bold: true };

//     });

//     worksheet.columns.forEach(column => {
//         column.width = 20;
//     });


//     const lastRow = worksheet.lastRow;
//     lastRow.eachCell((cell, colNumber) => {
//         cell.font = { bold: true };
//     });


//     return workbook.xlsx
// }

// async function getMonthlyAttendanceExcelSheet(req, res) {
//     try {
//         let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
//         let year = (req.body.year || req.query.year)
//         let month = (req.body.month || req.query.month)
//         let limit = (req.body.limit || req.query.limit)
//         let pageNo = (req.body.pageNo || req.query.pageNo)
//         let empCode = (req.body.empCode || req.query.empCode)
//         let empName = (req.body.empName || req.query.empName)
//         let branchId = (req.body.branchId || req.query.branchId)
//         let deptId = (req.body.deptId || req.query.deptId)
//         let designId = (req.body.designId || req.query.designId)
//         let subCompanyId = (req.body.subCompanyId || req.query.subCompanyId)
//         let subDepartmentId = (req.body.subDepartmentId || req.query.subDepartmentId)
//         let location = (req.body.location || req.query.location)
//         let userrole = (req.body.userrole || req.query.userrole)
//         let empType = (req.body.empType || req.query.empType)
//         let category = (req.body.category || req.query.category)

//         let apiData = await fetchData({ token,year, userrole,month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location,empType,category })
//         // if (apiData.employee.length == 0) {
//         //     return res.status(400).send({ status: false, msg: 'no data found' })
//         // }


//         let getExcel = createExcelFile(apiData)


//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', `attachment; filename="monthlyAttendance.xlsx"`);

//         (await getExcel).write(res)

//     } catch (error) {
//         return res.status(500).send({ status: false, msg: error.message })
//     }
// }

// module.exports = { getMonthlyAttendanceExcel, getMonthlyAttendanceExcelSheet }