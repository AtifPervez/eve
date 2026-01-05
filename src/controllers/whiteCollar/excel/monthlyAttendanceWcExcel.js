
let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions');
const moment = require('moment');
const dayjs = require('dayjs');
const axios = require('axios')
const ExcelJS = require('exceljs')



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



const getleaveNameById = async (leaveTypeId, db) => {

    let empleaveType = await db.query(`
                                      SELECT prefix
                                      FROM eve_acc_leave_type 
                                      WHERE id=:id`,
        {

            replacements: {
                id: leaveTypeId
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

function addTimes(times) {
    let totalMinutes = 0;

    // Convert each time to minutes and add to the total
    times.forEach(time => {
        const timeMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
        totalMinutes += timeMinutes;
    });

    // Convert the total minutes back to hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Format the result
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}



function formatAmount(numericString) {

    if (numericString != null) {
        let numericValue = numericString
        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return formattedString
    }
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
                                      where id=:id
                                      
                                      `, {
        replacements: {
            id: leaveTypeId
        },
        type: QueryTypes.SELECT
    })
    if (empleaveType[0]) {
        return empleaveType[0]
    }
}



//API
const getMonthlyAttendanceWcExcel = async (req, res) => {

    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize('')

        // let tokenUserId = '29'
        // let tokenCompanyId = '59'
        // let tokenbranchId = '1'
        // let tokenMainUserId = '1705'
        // let db = sequelize(tokenCompanyId)
        // let db1 = sequelize('eveserverind_main')

        let data = req.body
        let { year, month } = data
        let subCompanyId = (req.body.subCompanyId || null)
        let pageType = (req.body.pageType)
        let empCode = (req.body.empCode || null)
        let empName = (req.body.empName || null)
        let branchId = (req.body.branchId || null)

        let empInactiveName = (req.body.empInactiveName || null)
        let deptId = (req.body.deptId || null)
        let designId = (req.body.designId || null)
        let subDepartmentId = (req.body.subDepartmentId || null)
        let location = (req.body.location || null)

        let category = (req.body.category || null)
        let userrole = req.body.userrole
        let sortOrder = req.body.sortOrder

        sortOrder = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        let limit, pageNo, totalData, countQuery, getData
        let compensatoryOffAct
        const compensatoryOffLeaveAct = await moduleActivation('compensatory_off_leave', db)
        const compensatoryOffPaidAct = await moduleActivation('compensatory_off_paid', db)
        if (compensatoryOffLeaveAct == 'yes' || compensatoryOffPaidAct == 'yes') {
            compensatoryOffAct = 'yes'
        }
        else {
            compensatoryOffAct = 'no'
        }




        const daysInCurrentMonth = getDaysInMonth(year, month);

        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

        // let dateArr = []
        // for (let i = 1; i <= NoOfdaysInMonth; i++) {
        //     let number = i.toString().padStart(2, '0');

        //     let dateObj = {
        //         date: `${year}-${month}-${number}`,
        //         dayNo: i,
        //         backcolor: "#00000000",
        //     }
        //     dateArr.push(dateObj);
        // }

        // await Promise.all(dateArr.map(async e => {

        //     let attendanceQuery = await db.query(`

        //             SELECT employeeId,date,type,remarks 
        //             FROM eve_acc_employee_attendence_approved
        //             WHERE status='A'
        //             AND ( type='full' OR type='holiday' OR type='half' OR type='reject')
        //             AND date=:date


        //             `, {
        //         replacements: {
        //             date: e.date
        //         }, type: QueryTypes.SELECT
        //     })

        //     let actionQuery = await db.query(`

        //                 SELECT emp.id FROM eve_acc_employee as emp

        //                 LEFT JOIN eve_employee_resignation_list as res on emp.id=res.empId

        //                 WHERE emp.status='A'
        //                  AND emp.employeeType='Blue Collar'
        //                  and res.status='A'


        //                      AND (employeeCurrentStatus = '' 
        //                      OR employeeCurrentStatus IS NULL 
        //                      OR employeeCurrentStatus = 'Active'
        //                      OR employeeCurrentStatus = 'resignation' 
        //                      OR employeeCurrentStatus = 'joining'
        //                      OR employeeCurrentStatus = 'termination'
        //                      OR employeeCurrentStatus = 'release' 
        //                      OR employeeCurrentStatus = 'offerletter')
        //                      AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth
        //                      -- AND (DATE_FORMAT(employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR employeeLastWorkingDate IS NULL )
        //                        AND (DATE_FORMAT( res.lastWorkingDate, "%Y-%m") >= :yearMonth OR  res.lastWorkingDate IS NULL )


        //                 `, {
        //         replacements: {
        //             yearMonth: year + '-' + month

        //         }, type: QueryTypes.SELECT
        //     })

        //     let allPresent = actionQuery.every(bItem => attendanceQuery.some(aItem => aItem.employeeId === bItem.id.toString()));
        //     if (allPresent === true) {
        //         e.backcolor = '#ffff0000'
        //     }

        // }))


        // let branchId = req.body.pageType !== 'all-multiple-approve-attendance' ? tokenbranchId : (req.body.branchId || null);

        if (pageType == 'all-multiple-approve-attendance') {
            countQuery = await db.query(`
                SELECT COUNT(*) AS total FROM eve_acc_employee AS emp

                 left join eve_employee_resignation_list AS res ON emp.id = res.empId and res.resignStatus = 'A' 

                 WHERE emp.status = 'A'

               
                  
                  AND (emp.employeeType ='' OR emp.employeeType IS NULL OR emp.employeeType='White Collar')
               
                   AND (:empName IS NULL OR REPLACE(emp.employeeName, '  ', ' ') = REPLACE(:empName, '  ', ' '))
                   and (:empInactiveName is null or emp.id = :empInactiveName)
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
                       AND (DATE_FORMAT( res.lastWorkingDate, "%Y-%m") >= :yearMonth OR  res.lastWorkingDate IS NULL )

                     -- AND (:empType IS NULL OR   emp.empTypeId=:empType)
                     AND (:category IS NULL OR   emp.employeeType=:category)
                 
                 `,
                {
                    replacements:
                    {
                        subCompanyId: subCompanyId,
                        empCode: empCode,
                        empName: empName,
                        empInactiveName: empInactiveName,
                        branchId: branchId,
                        deptId: deptId,
                        designId: designId,
                        subDepartmentId: subDepartmentId,
                        location: location,
                        // empType: empType,
                        category: category,
                        yearMonth: year + '-' + month,



                    },
                    type: QueryTypes.SELECT
                }
            )
            totalData = countQuery[0].total;
        }
        else {
            countQuery = await db.query(`
            SELECT COUNT(*) AS total FROM eve_acc_employee AS emp

             left join eve_employee_resignation_list AS res ON emp.id = res.empId and res.resignStatus = 'A' 

             WHERE emp.status = 'A'

           
              
              AND (emp.employeeType ='' OR emp.employeeType IS NULL OR emp.employeeType='White Collar')

              AND emp.employeeBranchId=:tokenbranchId
           
               AND (:empName IS NULL OR REPLACE(emp.employeeName, '  ', ' ') = REPLACE(:empName, '  ', ' '))
               and (:empInactiveName is null or emp.id = :empInactiveName)
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
                   AND (DATE_FORMAT( res.lastWorkingDate, "%Y-%m") >= :yearMonth OR  res.lastWorkingDate IS NULL )

                 -- AND (:empType IS NULL OR   emp.empTypeId=:empType)
                 AND (:category IS NULL OR   emp.employeeType=:category)
             
             `,
                {
                    replacements:
                    {
                        subCompanyId: subCompanyId,
                        empCode: empCode,
                        empName: empName,
                        empInactiveName: empInactiveName,
                        branchId: branchId,
                        deptId: deptId,
                        designId: designId,
                        subDepartmentId: subDepartmentId,
                        location: location,
                        // empType: empType,
                        category: category,
                        yearMonth: year + '-' + month,
                        tokenbranchId: tokenbranchId



                    },
                    type: QueryTypes.SELECT
                }
            )


            totalData = countQuery[0].total;
        }
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






        if (pageType == 'all-multiple-approve-attendance') {

            // Reset row numbering before query execution
            await db.query(`SET @row_number = :offset;`, {
                replacements: { offset: offset },
                type: QueryTypes.RAW,
            });




            getData = await db.query(
                `
    SELECT 
        @row_number := @row_number + 1 AS slno,  -- Serial Number is assigned AFTER pagination
        empId, 
        empName, 
        empCode, 
        branchName, 
        branchId, 
        subCompanyName, 
        subCompanyId, 
        departmentName, 
        deptId, 
        designName, 
        designId, 
        subDepartmentName, 
        subDepartmentId, 
        location, 
        category, 
        locationName,
        employeeSubCompanyId,
        employmentLeaveType,
        resignationDate,
        employeeDoj,
        lastWorkingDate,multipleClockInClockOut
    FROM (
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
            emp.locationID AS location,
            emp.employeeType AS category,
            eve_acc_locationmaster.location AS locationName,
            emp.employeeSubCompanyId,
            emp.employmentLeaveType,
            emp.employeeDoj,
            res.resignationDate,
            res.lastWorkingDate,emp.multipleClockInClockOut
        FROM
            eve_acc_employee AS emp
        LEFT JOIN
            eve_acc_locationmaster ON emp.locationID = eve_acc_locationmaster.id
        LEFT JOIN 
            eve_employee_resignation_list AS res ON emp.id = res.empId and res.resignStatus = 'A' 
        WHERE
            emp.status = 'A'
            
            AND (emp.employeeType ='' OR emp.employeeType IS NULL OR emp.employeeType='White Collar')
            AND (:empName IS NULL OR REPLACE(emp.employeeName, '  ', ' ') = REPLACE(:empName, '  ', ' '))
            and (:empInactiveName is null or emp.id = :empInactiveName)
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
            AND (DATE_FORMAT(res.lastWorkingDate, "%Y-%m") >= :yearMonth OR res.lastWorkingDate IS NULL)
            AND (:category IS NULL OR emp.employeeType = :category)
        ORDER BY emp.employeeName ${sortOrder}
        LIMIT :limit
        OFFSET :offset
    ) AS sub
    `,
                {
                    replacements: {
                        limit: limit,
                        offset: offset,
                        subCompanyId: subCompanyId,
                        empCode: empCode,
                        empName: empName,
                        empInactiveName: empInactiveName,
                        branchId: branchId,
                        deptId: deptId,
                        designId: designId,
                        subDepartmentId: subDepartmentId,
                        location: location,
                        category: category,
                        yearMonth: year + "-" + month,
                    },
                    type: QueryTypes.SELECT,
                }
            )
        }
        else {

            // Reset row numbering before query execution
            await db.query(`SET @row_number = :offset;`, {
                replacements: { offset: offset },
                type: QueryTypes.RAW,
            });
            getData = await db.query(
                `
    SELECT 
        @row_number := @row_number + 1 AS slno,  -- Serial Number is assigned AFTER pagination
        empId, 
        empName, 
        empCode, 
        branchName, 
        branchId, 
        subCompanyName, 
        subCompanyId, 
        departmentName, 
        deptId, 
        designName, 
        designId, 
        subDepartmentName, 
        subDepartmentId, 
        location, 
        category, 
        locationName,
        employeeSubCompanyId,
        employmentLeaveType,
        resignationDate,
        employeeDoj,
        lastWorkingDate,multipleClockInClockOut
    FROM (
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
            emp.locationID AS location,
            emp.employeeType AS category,
            eve_acc_locationmaster.location AS locationName,
            emp.employeeSubCompanyId,
            emp.employmentLeaveType,
            emp.employeeDoj,
            res.resignationDate,
            res.lastWorkingDate,emp.multipleClockInClockOut
        FROM
            eve_acc_employee AS emp
        LEFT JOIN
            eve_acc_locationmaster ON emp.locationID = eve_acc_locationmaster.id
        LEFT JOIN 
            eve_employee_resignation_list AS res ON emp.id = res.empId and res.resignStatus = 'A' 
        WHERE
            emp.status = 'A'
              AND emp.employeeBranchId=:tokenbranchId
            
            AND (emp.employeeType ='' OR emp.employeeType IS NULL OR emp.employeeType='White Collar')
            AND (:empName IS NULL OR REPLACE(emp.employeeName, '  ', ' ') = REPLACE(:empName, '  ', ' '))
            and (:empInactiveName is null or emp.id = :empInactiveName)
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
            AND (DATE_FORMAT(res.lastWorkingDate, "%Y-%m") >= :yearMonth OR res.lastWorkingDate IS NULL)
            AND (:category IS NULL OR emp.employeeType = :category)
        ORDER BY emp.employeeName ${sortOrder}
        LIMIT :limit
        OFFSET :offset
    ) AS sub
    `,
                {
                    replacements: {
                        limit: limit,
                        offset: offset,
                        subCompanyId: subCompanyId,
                        empCode: empCode,
                        empName: empName,
                        empInactiveName: empInactiveName,
                        branchId: branchId,
                        deptId: deptId,
                        designId: designId,
                        subDepartmentId: subDepartmentId,
                        location: location,
                        category: category,
                        yearMonth: year + "-" + month,
                        tokenbranchId: tokenbranchId
                    },
                    type: QueryTypes.SELECT,
                }
            )

        }

        let totalWork
        let totalActualShift
        let timeArr = []
        let shiftArr = []

        const dbMainModel = await db1.query(
            `
                select isCompanySelfieActivate from eve_main_company where id=:id
                `

            ,
            {
                replacements: {
                    id: tokenCompanyId
                },
                type: QueryTypes.SELECT
            })


        let isCompanySelfieActivate = dbMainModel[0].isCompanySelfieActivate


        await Promise.all(getData.map(async (e) => {



            e.empResignationDateStr = Math.floor(new Date(e.resignationDate).getTime() / 1000).toString()

            e.empJDateStr = Math.floor(new Date(e.employeeDoj).getTime() / 1000).toString()

            // const appDetailsObj = [];
            // for (let i = 1; i <= NoOfdaysInMonth; i++) {

            //     let number = i.toString().padStart(2, '0');
            //     let empDtStrdate = new Date(`${year}-${month}-${number}`);
            //     let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

            //     let newObj = {
            //         crtDate: `${year}-${month}-${number}`,
            //         attStatus: "--",
            //         empDtStr: `${timestamp}`,
            //         backcolor: "--",
            //         title: "--",
            //         type: '--',
            //         remarks: '--',
            //         leaveTypeId: '--',
            //         leaveStatus: '--'
            //     };

            //     appDetailsObj.push(newObj);
            // }
            // e.leaveDetails = appDetailsObj

            // let empAttendanceApproved = await db.query(`
            //  SELECT employeeId,date,type,remarks,leaveTypeId
            //  FROM eve_acc_employee_attendence_approved
            //  WHERE status='A'
            //  AND employeeId=:employeeId
            //  AND YEAR(date) = :year
            //  AND MONTH(date) = :month
            //  `, {
            //     replacements: {
            //         employeeId: e.empId,
            //         year: year,
            //         month: month
            //     },
            //     type: QueryTypes.SELECT
            // })

            // let leaveAprovedHistory = await db.query(`
            //                         SELECT empId,leaveTypeId,fromDate,toDate,leaveStatus
            //                         FROM  eve_acc_employee_leave_history
            //                         WHERE status='A'
            //                         AND empId=:empId
            //                         AND YEAR(fromDate)=:year               
            //                         AND YEAR(toDate)=:year
            //                         AND MONTH(fromDate)=:month               
            //                         AND MONTH(toDate)=:month `, {
            //     replacements: {
            //         empId: e.empId,
            //         year: year,
            //         month: month
            //     },
            //     type: QueryTypes.SELECT
            // })

            // let attendanceMap = new Map()
            // let leaveMap = new Map()
            // let leaveMap1 = new Map()
            // empAttendanceApproved.map(x => attendanceMap.set(x.date, x))
            // leaveAprovedHistory.map(x => leaveMap.set(x.fromDate, x))
            // leaveAprovedHistory.map(x => leaveMap1.set(x.toDate, x))

            // await Promise.all(e.leaveDetails.map(async x => {

            //     if (attendanceMap.has(x.crtDate)) {
            //         let leaveRecord = attendanceMap.get(x.crtDate)
            //         x.type = leaveRecord.type
            //         x.remarks = leaveRecord.remarks
            //         x.leaveTypeId = leaveRecord.leaveTypeId

            //         if (x.type == "full") {
            //             x.title = "Present";
            //             x.attStatus = "P"
            //         }

            //         else if (x.type == "reject" && x.remarks != "AB LEAVE" && x.remarks != "First Half" && x.remark != "Second Half") {
            //             x.attStatus = "AB"

            //             x.title = "Absent";

            //         }
            //         else if (x.type == "half") {

            //             x.attStatus = "HD"

            //             x.title = "Halfday";

            //         }
            //         else if (x.leaveTypeId && x.type == 'holiday' && x.remarks == 'L LEAVE' && x.leaveTypeId != null) {
            //             let leaveResult = await myFunc.leaveType(x.leaveTypeId, db)
            //             x.attStatus = leaveResult.prefix
            //             x.title = leaveResult.name

            //         }
            //         else if (x.type == 'holiday' && x.remarks == 'L LEAVE' && x.leaveTypeId == '') {
            //             x.attStatus = 'D-PL'
            //             x.title = 'Default Paid Leave'
            //         }
            //         else if (x.type == 'reject' && x.remarks == 'AB LEAVE') {
            //             x.attStatus = 'UL'
            //             x.title = 'Unpaid Leave'
            //         }
            //         else if (x.type == 'holiday' && x.remarks == 'First Half' || x.remarks == 'Second Half') {
            //             x.attStatus = 'HD-PL'
            //             x.title = 'Halfday Paid Leave';
            //         }
            //         else if (x.type == 'reject' && x.remarks == 'First Half' || x.remarks == 'Second Half') {
            //             x.attStatus = 'HD-UL'
            //             x.title = 'Halfday unpaid Leave';
            //         }
            //         else if (x.type == 'holiday' && x.remarks != 'L LEAVE' && x.remarks != 'First Half' && x.remarks != 'Second Half') {
            //             x.attStatus = 'MHD'
            //             x.title = 'Marked as Holiday';
            //         }
            //         else if (x.type == "sunday reject") {
            //             x.attStatus = "AB"
            //             x.title = "Absent";
            //         }
            //         else {
            //             x.attStatus = "--";
            //             x.title = "--";
            //         }

            //     }

            //     if (leaveMap.has(x.crtDate)) {
            //         let leaveDetails = leaveMap.get(x.crtDate)
            //         let leaveResult = await myFunc.leaveType(leaveDetails.leaveTypeId, db)

            //         x.attStatus = leaveResult.prefix

            //         x.title = leaveResult.name
            //         x.leaveTypeId = leaveDetails.leaveTypeId
            //         x.leaveStatus = leaveDetails.leaveStatus

            //         if (leaveDetails.leaveStatus === 'C') {
            //             x.backcolor = '#ffa7a5'
            //         }
            //         else if (leaveDetails.leaveStatus === 'W') {
            //             x.backcolor = '#ADD8E6'
            //         }
            //         else if (leaveDetails.leaveStatus === 'A') {
            //             x.backcolor = '#90EE90'
            //         }

            //     }

            //     if (leaveMap1.has(x.crtDate)) {
            //         let leaveDetails = leaveMap1.get(x.crtDate)
            //         let leaveResult = await myFunc.leaveType(leaveDetails.leaveTypeId, db)

            //         x.attStatus = leaveResult.prefix

            //         x.title = leaveResult.name

            //         x.leaveTypeId = leaveDetails.leaveTypeId
            //         x.leaveStatus = leaveDetails.leaveStatus

            //         if (leaveDetails.leaveStatus === 'C') {
            //             x.backcolor = '#ffa7a5'
            //         }
            //         else if (leaveDetails.leaveStatus === 'W') {
            //             x.backcolor = '#ADD8E6'
            //         }
            //         else if (leaveDetails.leaveStatus === 'A') {
            //             x.backcolor = '#90EE90'
            //         }
            //     }

            // }))




            // let leaveDb = await db.query(` SELECT 
            //                                prefix, 
            //                                colorCode 
            //                                FROM eve_acc_leave_type WHERE status='A'`,
            //     {
            //         type: QueryTypes.SELECT
            //     });


            // let totalLeaveCounts = {};
            // let pendingCounts = {};
            // let appliedCount = {};
            // let approvedCounts = {};
            // let rejectCounts = {};
            // let closingBalanceCount = {};

            // leaveDb.forEach(x => {

            //     pendingCounts[x.prefix] = 0;
            //     approvedCounts[x.prefix] = 0;
            //     rejectCounts[x.prefix] = 0;
            //     appliedCount[x.prefix] = 0;
            //     closingBalanceCount[x.prefix] = 0;
            // });

            // e.leaveDetails.forEach(x => {
            //     if (totalLeaveCounts[x.attStatus] !== undefined) {
            //         totalLeaveCounts[x.attStatus]++;
            //     }
            //     if (closingBalanceCount[x.attStatus] !== undefined) {
            //         closingBalanceCount[x.attStatus]++;
            //     }

            //     if (pendingCounts[x.attStatus] !== undefined && x.leaveStatus === 'W') {
            //         pendingCounts[x.attStatus]++;
            //     }

            //     if (approvedCounts[x.attStatus] !== undefined && x.leaveStatus === 'A') {
            //         approvedCounts[x.attStatus]++;
            //     }

            //     if (rejectCounts[x.attStatus] !== undefined && x.leaveStatus === 'C') {
            //         rejectCounts[x.attStatus]++;
            //     }
            //     if (appliedCount[x.attStatus] !== undefined && x.leaveStatus === 'A' || x.leaveStatus === 'C' || x.leaveStatus === 'W') {
            //         appliedCount[x.attStatus]++;
            //     }
            // });

            // let leaveSetting = await db.query(`
            //        SELECT 
            //        subCompanyId,
            //        leaveTypeId,
            //        allocateLeaveDays,
            //        leaveTypeId AS prefix
            //        FROM eve_acc_leave_setting 
            //        WHERE status='A'
            //        AND subCompanyId=:subCompanyId               
            //        AND employmentLeaveTypeId=:employmentLeaveTypeId               

            //     `, {
            //     replacements: {
            //         subCompanyId: e.employeeSubCompanyId,
            //         employmentLeaveTypeId: e.employmentLeaveType
            //     },
            //     type: QueryTypes.SELECT
            // })






            // const leaveMapData = new Map()

            // await Promise.all(leaveSetting.map(async (x) => {
            //     x.prefix = await getleaveNameById(x.prefix, db);
            //     leaveMapData.set(x.prefix, parseFloat(x.allocateLeaveDays));
            // }));

            // e.totalLeave = leaveDb.map(leaveType => ({
            //     ...leaveType,
            //     total: leaveMapData.get(leaveType.prefix) || 0
            // }));




            // totalLeave = leaveDb.map(leaveType => ({
            //     ...leaveType,

            // }));


            e.paidLeaveDetails = []

            e.status = 'Pending'

            if (e.branchName != null && e.branchName != '') {
                e.branchName = await getBranchNameByBranchId(e.branchName, db)
            }

            e.empName = e.empName === null ? '' : e.empName

            if (e.subCompanyName != null && e.subCompanyName != '') {
                e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)
            }
            if (e.subCompanyName == null) {
                e.subCompanyName = ''
            }
            if (e.subCompanyId == null) {
                e.subCompanyId = ''
            }
            if (e.designName != null && e.designName != '') {
                e.designName = await getDesignationNameById(e.designName, db)
            }
            if (e.designName == null) {
                e.designName = ''
            }
            if (e.departmentName != null && e.departmentName != '') {
                e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)
            }
            if (e.departmentName == null) {
                e.departmentName = ''
            }
            if (e.subDepartmentName != null && e.subDepartmentName != '') {
                e.subDepartmentName = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentName, db)
            }
            if (e.subDepartmentName == null) {
                e.subDepartmentName = ''
            }
            if (e.subCompanyId != null) {

                e.subCompanyId = e.subCompanyId.toString()
            }
            if (e.employeeType == null) {
                e.employeeType = String
            }
            if (e.locationName == null) {
                e.locationName = ''
            }

            // e.type = await myFunc.getEmpTypeName(e.empTypeId, db)

            // const comapanyPolicy = await db.query(`
            //                                     SELECT
            //                                     policy_status
            //                                     FROM eve_hrm_company_policy_employee
            //                                     WHERE status='A'
            //                                     AND employeeId=:employeeId
            //                                     `, {
            //     replacements: {
            //         employeeId: e.empId

            //     },

            //     type: QueryTypes.SELECT
            // })



            // if (comapanyPolicy.length > 0) {
            //     let allStatusW = comapanyPolicy.every(x => x.policy_status === "W")
            //     let allStatusA = comapanyPolicy.every(x => x.policy_status === "A")

            //     if (allStatusW) {
            //         e.policyStatus = false
            //     }
            //     else if (allStatusA) {
            //         e.policyStatus = true
            //     } else {
            //         e.policyStatus = false
            //     }
            // } else {
            //     e.policyStatus = true
            // }


            // e.actualShiftHours = ''

            // const empRoasterModel = await db.query(
            //     `
            //     SELECT
            //     a.shiftId,
            //     b.clockInTime,
            //     b.clockOutTime,
            //     b.minWorkingHour,
            //     b.minWorkingHourMin

            //     FROM eve_hrm_employee_roaster AS a
            //     LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id 
            //     WHERE a.status='A'
            //     AND employeeId=:empId



            //     -- AND DATE_FORMAT(a.fromDate,'%d-%m-%Y') <= :date
            //     -- AND DATE_FORMAT(a.toDate,'%d-%m-%Y') >= :date 

            //      AND YEAR(fromDate)=:year
            //      AND MONTH(fromDate)=:month


            //     `,
            //     {
            //         replacements: {
            //             empId: e.empId,
            //             year: year,
            //             month: month,
            //         },
            //         type: QueryTypes.SELECT
            //     }
            // )




            // if (empRoasterModel.length > 0 && empRoasterModel[0]['minWorkingHour'] !== null && empRoasterModel[0]['minWorkingHourMin'] !== null) {
            //     e.actualShiftHours = `${(empRoasterModel[0]['minWorkingHour'])}:${(empRoasterModel[0]['minWorkingHourMin'])}`
            //     shiftArr.push(e.actualShiftHours)
            // }
            // else {
            //     const empShiftModel = await db.query(
            //         `
            //         SELECT a.shiftId,b.minWorkingHour,b.minWorkingHourMin 
            //         FROM eve_hrm_employee_details AS a
            //         LEFT JOIN eve_hrm_employee_shift_master AS b ON a.shiftId=b.id  
            //         WHERE a.status='A'
            //         AND employeeId=:empId 
            //         `, {
            //         replacements: {
            //             empId: e.empId

            //         }, type: QueryTypes.SELECT
            //     }
            //     )


            //     if (empShiftModel.length > 0 && empShiftModel[0]['minWorkingHour'] !== null && empShiftModel[0]['minWorkingHourMin'] !== null) {

            //         e.actualShiftHours = `${(empShiftModel[0]['minWorkingHour'])}:${(empShiftModel[0]['minWorkingHourMin'])}`
            //         shiftArr.push(e.actualShiftHours)
            //     }
            //     else {
            //         e.actualShiftHours = ''
            //     }
            // }


            e.totalFullDay = 0
            e.totalHalfDay = 0
            e.totalReject = 0
            e.totalAbsent = 0
            e.totalRejectedSunday = 0
            e.totalPaidLeave = 0
            e.totalUnpaidLeave = 0
            e.totalHalfdayPaidLeave = 0
            e.totalHalfdayPaidLeave = 0
            e.totalHalfdayunpaidLeave = 0
            e.totalMarkedAsHoliday = 0
            e.totalWorkingHour = 0
            e.totalPaidHoliday = 0
            e.compOff = []
            e.holidayArr = []
            e.inOutArr = []
            e.earningSalary = 0
        }))

        /************************************************************************************** */
        //Case==creditSetting of employees



        let eve_self_registration = await db.query(`
                                                   SELECT * FROM  eve_self_registration WHERE status="A"
                                                   `, {
            type: QueryTypes.SELECT
        })

        for (let i = 0; i < getData.length; i++) {
            for (let j = 0; j < eve_self_registration.length; j++) {
                if (getData[i].empId == eve_self_registration[j].empId && month == eve_self_registration[j].mm && year == eve_self_registration[j].yyyy) {
                    getData[i].creditSetting = [{
                        creditDay: eve_self_registration[j].creadit_month,
                        creditUsed: eve_self_registration[j].used,
                        employeeId: eve_self_registration[j].empId
                    }]
                }
            }
        }

        /******************************************************************************** */


        //monthlySalaryDb=eve_acc_set_monthly_salary_employee_wise
        let monthlySalaryDb = await db.query('select * from eve_acc_set_monthly_salary_employee_wise where status="A"', {
            type: QueryTypes.SELECT
        })

        let extra_duty_off_paid = await db.query('select * from  eve_acc_module_activation_master where status="A" && name=:name', {
            replacements: {
                name: "extra_duty_off_paid"
            },
            type: QueryTypes.SELECT
        })

        for (let i = 0; i < getData.length; i++) {

            for (let j = 0; j < monthlySalaryDb.length; j++) {



                if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'addition') {

                    getData[i].earningSalary += (parseFloat(monthlySalaryDb[j].salaryAmount))


                }
                else if (getData[i].empId == monthlySalaryDb[j].employeeId && monthlySalaryDb[j].salaryAmount != '' && monthlySalaryDb[j].type == 'deduction') {
                    getData[i].earningSalary -= (parseFloat(monthlySalaryDb[j].salaryAmount))



                }
            }
        }


        //extraDutyEmpById

        let totalDaysOfMOnth = getDaysInMonth(year, month);
        let startDate = `${year}-${month}-01`

        let endDate = `${year}-${month}-${totalDaysOfMOnth}`


        let totalCompOffDays = 0
        for (let i = 0; i < getData.length; i++) {
            getData[i].Amount = formatAmount((getData[i].earningSalary) / totalDaysOfMOnth)
            // getData[i].Amount = ((getData[i].earningSalary)/totalDaysOfMOnth)

            getData[i].earningSalary = formatAmount(getData[i].earningSalary)
            // getData[i].earningSalary = (getData[i].earningSalary)


        }

        if ((extra_duty_off_paid.length) > 0) {


            let eve_acc_extra_duty_encashment_calculation_setting = await db.query('select * from eve_acc_extra_duty_encashment_calculation_setting where status="A"', {
                type: QueryTypes.SELECT
            })

            let extraDuty = eve_acc_extra_duty_encashment_calculation_setting



            let tempSalaryAmount = 0

            for (let i = 0; i < extraDuty.length; i++) {
                for (let j = 0; j < monthlySalaryDb.length; j++) {

                    if (extraDuty[i].salaryTemplateId == monthlySalaryDb[j].salaryTempId && extraDuty[i].salaryComponents) {

                    }
                }
            }


        }




        //fixedWeeklyHoliday

        getData = getData.map((value) => {
            value.fixedWeeklyOffDay = ''
            return value
        })

        let fixedWeeklyHolidayDb = await db.query('select * from eve_acc_company_fix_weekly_holiday where status="A"', {

            type: QueryTypes.SELECT

        })

        for (let i = 0; i < getData.length; i++) {
            for (let j = 0; j < fixedWeeklyHolidayDb.length; j++) {

                if (getData[i].branchId == fixedWeeklyHolidayDb[j].branchId) {
                    getData[i].fixedWeeklyOffDay = fixedWeeklyHolidayDb[j].day
                }

            }
        }

        //additionalWeeklyOffDay

        function weeklyHolidayArrayFn(options) {

            let days = ['sunday', 'monday', 'tuesday', "wednesday", "thursday", 'friday', 'saturday']

            let { month, year, dayName, dayNoStr } = options
            let date = moment(`${year}-${month}-01`)

            let dayIndex = days.indexOf(dayName)
            let currentDay = date.format('dddd').toLowerCase()
            let currentDayIndex = days.indexOf(currentDay)
            let firstDayNo = '01'

            if (dayIndex > currentDayIndex) {

                firstDayNo = (dayIndex - currentDayIndex) + 1

            }
            else if (dayIndex < currentDayIndex) {

                let diffAfterCurrentDay = (days.length) - (currentDayIndex)
                let diffBeforeDay = dayIndex + 1
                firstDayNo = diffAfterCurrentDay + diffBeforeDay
            }

            else if (dayIndex == currentDayIndex) {
                firstDayNo = 1
            }

            let dayNo = dayNoStr.toString().replace(/(?![0-9])./g, '') * 1
            if (dayNo > 1) {

                firstDayNo += (7 * (dayNo - 1))

            }
            // return firstDayNo
            return (firstDayNo < 10 ? `0${firstDayNo}` : `${firstDayNo}`)
        }


        getData = getData.map((value) => {
            value.additionalWeeklyOffDay = {
                day: null,
                weeklyHolidayArray: []
            }
            return value
        })


        let companyWeeklyHolidayDb = await db.query('select * from eve_acc_company_weekly_holiday where status="A"', { type: QueryTypes.SELECT })

        for (let i = 0; i < getData.length; i++) {
            // getData[i].addWeeklyOffDay=''

            for (let j = 0; j < companyWeeklyHolidayDb.length; j++) {

                if (getData[i].branchId == companyWeeklyHolidayDb[j].branchId) {
                    // getData[i].addWeeklyOffDay= companyWeeklyHolidayDb[j].day

                    // let options = {
                    //     month: month,
                    //     year: year,
                    //     dayName: companyWeeklyHolidayDb[j].day.toLowerCase(),
                    // }
                    let options = {
                        month: month,
                        year: year,
                        dayName: companyWeeklyHolidayDb[j].day
                            ? companyWeeklyHolidayDb[j].day.toLowerCase()
                            : '',
                    }


                    getData[i].additionalWeeklyOffDay.day = companyWeeklyHolidayDb[j].day

                    if (typeof (companyWeeklyHolidayDb[j].weeks) == "string" && companyWeeklyHolidayDb[j].weeks !== "null") {
                        let weeksArray = companyWeeklyHolidayDb[j].weeks.split(',')


                        for (let k = 0; k < weeksArray.length; k++) {

                            options.dayNoStr = weeksArray[k]
                            getData[i].additionalWeeklyOffDay.weeklyHolidayArray.push(weeklyHolidayArrayFn(options))

                        }
                    }
                }
            }
        }
        //****************************************************************************//


        getData = getData.map((value) => {
            value.empId = value.empId.toString()
            return value
        })

        getData = getData.map((value) => {
            value.base64_empId = Buffer.from(value.empId || '').toString('base64')
            return value
        })

        //sandwich_leave


        let sandwich_leave = await db.query(`
                                            SELECT * 
                                            FROM eve_acc_module_activation_master 
                                            where (status='A' OR status='I') AND name='sandwich_leave'`,
            {
                type: QueryTypes.SELECT
            })




        //appDetails

        function getDaysInMonth(year, month) {
            return new Date(year, month, 0).getDate();
        }

        getData = getData.map((value) => {
            value.totalDays = NoOfdaysInMonth
            return value
        })


        let employeeAttendance = await db.query('select * from eve_acc_employee_attendence where status="A"', {
            type: QueryTypes.SELECT
        })

        const appDetailsObj = [];

        for (let i = 1; i <= NoOfdaysInMonth; i++) {
            let number = i.toString().padStart(2, '0');

            let empDtStrdate = new Date(`${year}-${month}-${number}`);

            let timestamp = Math.floor(empDtStrdate.getTime() / 1000);



            let newObj = {
                crtDate: `${year}-${month}-${number}`,
                intime: "",
                outTime: "",
                workingHour: "00:00",
                breakHours: '--',
                empDatestr: '',
                shiftCategory: '',
                attStatus: "",
                empDtStr: `${timestamp}`,
                backcolor: "",
                title: "",
                inTimeRemarks: '--',
                outTimeRemarks: '--',
                launchIn: '00:00',
                launchOut: '00:00',
                isLeave: false,
                IsApprove: 'no',
                holidayStatus: false,
                resignStatus: false,
                dojStatus: '',
                joiningDate: false,
                checkInSelfie: '',
                checkInSelfiePath: '',
                lateAttendanceForLToolTip: '',
                lateAttendanceForLValue: '',
                type: '',
                titleStatus: '',
                weekOff: '',
                day: '',
                intimeStatus: '',
                outtimeStatus: '',
                deviceName: '',


            };
            appDetailsObj.push(newObj);
        }

        let employeeAttendanceApproved = await db.query(`
                                                        SELECT * 
                                                        FROM eve_acc_employee_attendence_approved 
                                                        WHERE status='A'`, {
            type: QueryTypes.SELECT
        })

        let eve_acc_company_holiday = await db.query('select * from eve_acc_company_holiday where status="A" ', {
            type: QueryTypes.SELECT
        })


        //db calling eve_acc_employee_compensatoryoff_alocation

        let compOffDetails = await db.query(`
                                             SELECT empId,workDate, type,compoffStatus,remarks 
                                             FROM eve_acc_employee_compensatoryoff_alocation 
                                             WHERE status="A" 
                                             AND (compoffStatus="A"||compoffStatus="C") `, {
            type: QueryTypes.SELECT
        })


        for (let i = 0; i < getData.length; i++) {
            let breakArr = []
            let statusArray = []

            let totalPaidLeaveArr = []

            let value = getData[i]


            //totalPaidLeave
            const [leaveData] = await db.query(
                `SELECT SUM(noOfDay) AS totalDeductLeave
                FROM eve_acc_leave_deduction_log
                WHERE empId = :empId AND type = 'L'
                AND status = 'A'
                AND YEAR(dayOfAction) = :year
                AND MONTH(dayOfAction) = :month`,
                {
                    replacements: {
                        empId: value.empId,
                        year,
                        month
                    },
                    type: QueryTypes.SELECT
                }
            );

            value.totalPaidLeave += leaveData.totalDeductLeave || 0;

            let _appDetailsObj = JSON.parse(JSON.stringify(appDetailsObj))


            let employeeAttendanceId = employeeAttendance.filter((x) => {
                return value.empId == x.empId
            })

            let empAttendanceIdOfApproved = employeeAttendanceApproved.filter((x) => {
                return value.empId == x.employeeId
            })
            /************************************************** */
            let employeeBranchId = eve_acc_company_holiday.filter((x) => {
                if (value.branchId == x.branchId) {
                    return true
                }
            })
            let compOffDetailsId = compOffDetails.filter((x) => {
                return (value.empId == x.empId)
            })




            /*****************************************/


            let resignationDateFound = false;
            let dojDateFound = false

            for (let j = 0; j < _appDetailsObj.length; j++) {




                let _appDetail = _appDetailsObj[j]
                _appDetail.day = moment(_appDetail.crtDate).format('dddd')
                // if(_appDetail.day===value.fixedWeeklyOffDay){
                //     _appDetail.weekOff=_appDetail.crtDate
                // value.holidayArr.push(_appDetail.crtDate)
                // }


                _appDetail.empDatestr = `${value.empId}${myFunc.formatDateCombine(_appDetail.crtDate)}`
                if (_appDetail.crtDate === value.employeeDoj) {
                    _appDetail.dojStatus = 'J'
                    _appDetail.Dojtitle = 'Joining Day'
                }

                if ((value.lastWorkingDate) < (_appDetail.crtDate)) {

                    resignationDateFound = true
                }
                if (resignationDateFound === true) {
                    _appDetail.resignStatus = true
                }

                if ((value.employeeDoj) <= (_appDetail.crtDate)) {
                    dojDateFound = true
                }
                if (dojDateFound === true) {
                    // _appDetail.dojStatus = true
                }
                if (value.employeeDoj === _appDetail.crtDate) {
                    // _appDetail.joiningDate = true
                }




                let targetObj = employeeAttendanceId.find((e) => {
                    return (e.empId == value.empId && _appDetail.crtDate == e.date)
                })
                let targetObjOfApproved = empAttendanceIdOfApproved.find((e) => {
                    return (e.employeeId == value.empId && _appDetail.crtDate == e.date)
                })

                let targetObjOfCompanyHoliday = employeeBranchId.find((e) => {
                    return (e.branchId == value.branchId && _appDetail.crtDate == e.date)
                })

                let targetObjOfCompOff = compOffDetailsId.find((e) => {
                    return (e.empId == value.empId && _appDetail.crtDate == e.workDate)
                })







                //compOff
                if (targetObjOfCompOff && compensatoryOffAct == 'yes') {

                    if (targetObjOfCompOff.compoffStatus == 'A' && targetObjOfCompOff.type == "full") {
                        _appDetail.compOffTitle = 'CO-FD'
                        _appDetail.compOffFullTitle = 'Comp Off - Full Day'
                    }
                    else if (targetObjOfCompOff.compoffStatus == 'A' && targetObjOfCompOff.type == "half") {
                        _appDetail.compOffTitle = 'CO-HD'
                        _appDetail.compOffFullTitle = 'Comp Off - Half Day'
                    }

                    else if (targetObjOfCompOff.compoffStatus == 'C') {
                        if (targetObjOfCompOff.remarks == '') {
                            _appDetail.compOffTitle = 'CO-R'
                            _appDetail.compOffFullTitle = 'Comp Off - Reject|Remarks:N/A'
                        }
                        else if (targetObjOfCompOff.remarks == null) {
                            _appDetail.compOffTitle = 'CO-R'
                            _appDetail.compOffFullTitle = 'Comp Off - Reject|Remarks:N/A'
                        }
                        else {
                            _appDetail.compOffTitle = 'CO-R'
                            _appDetail.compOffFullTitle = `Comp Off - Reject|Remarks:${targetObjOfCompOff.remarks}`
                        }

                    }

                }



                if (targetObj) {
                    _appDetail.checkInSelfiePath = targetObj.checkInSelfiePath
                    _appDetail.checkInSelfie = targetObj.checkInSelfie
                    _appDetail.type = targetObj.type

                    _appDetail.intimeStatus = targetObj.intimeStatus
                    _appDetail.outtimeStatus = targetObj.outtimeStatus

                    _appDetail.deviceName = targetObj.lensDeviceName



                    if (targetObj.intime != "--:undefined") {
                        _appDetail.intime = targetObj.intime
                    }

                    if (targetObj.outTime != "--:undefined") {
                        _appDetail.outTime = targetObj.outTime
                    }
                    if (targetObj.intime == '') {
                        _appDetail.intime = '00:00'
                    }
                    if (targetObj.outTime == '') {
                        _appDetail.outTime = '00:00'
                    }
                    _appDetail.inTimeRemarks = targetObj.inTimeRemarks

                    if (targetObj.inTimeRemarks == '') {
                        _appDetail.inTimeRemarks = '--'

                    }
                    _appDetail.outTimeRemarks = targetObj.outTimeRemarks
                    _appDetail.shiftCategory = targetObj.shift_type

                    if (targetObj.outTimeRemarks == '') {
                        _appDetail.outTimeRemarks = '--'

                    }

                    if (targetObj.startLunch != null) {

                        _appDetail.launchIn = targetObj.startLunch
                    }
                    if (targetObj.startLunch == '--:undefined') {

                        _appDetail.launchIn = '00:00'
                    }

                    if (targetObj.endLunch != null) {

                        _appDetail.launchOut = targetObj.endLunch
                    }

                    if (targetObj.endLunch == '--:undefined') {

                        _appDetail.launchOut = '00:00'
                    }




                    //inOutArr

                    if (targetObj.intime != null && targetObj.outTime != null && targetObj.intime != '' && targetObj.outTime != '') {
                        getData[i].inOutArr.push({
                            date: _appDetail.crtDate,
                            inTime: targetObj.intime,
                            outTime: targetObj.outTime,
                            intimeStatus: '0',
                            outtimeStatus: '0',
                            workingHourInMin: ''

                        })


                    }




                    if (_appDetail.intime && _appDetail.outTime != ":" && _appDetail.outTime) {
                        _appDetail.workingHour = calculateWorkingHours(_appDetail.intime, _appDetail.outTime)

                    }

                }

                if (_appDetail.shiftCategory === '') {
                    const empRoasterModel = await db.query(
                        `
                        select shiftId
                        from eve_hrm_employee_roaster
                        where employeeId=:employeeId
                        and status='A'
                        and fromDate >= :fromDate
                        and toDate <= :toDate
                        `, {
                        replacements: {
                            employeeId: value.empId,
                            fromDate: _appDetail.crtDate,
                            toDate: _appDetail.crtDate
                        },
                        type: QueryTypes.SELECT
                    })


                    if (empRoasterModel.length > 0 && empRoasterModel[0]?.shiftId) {
                        const empShiftModel = await db.query(
                            `
                            select * from eve_hrm_employee_shift_master
                            where status='A'
                            and id=:id
                                `, {
                            replacements: {
                                id: empRoasterModel[0].shiftId
                            }
                            , type: QueryTypes.SELECT
                        }
                        )
                        if (empShiftModel.length > 0) {
                            _appDetail.shiftCategory = empShiftModel[0].category
                        }

                    }
                    else {
                        const empDetailsModel = await db.query(
                            `

                            select shiftId from eve_hrm_employee_details
                            where status='A'
                            and employeeId=:employeeId
                    
                            `, {
                            replacements: {
                                employeeId: value.empId
                            }
                            , type: QueryTypes.SELECT
                        }
                        )



                        if (empDetailsModel.length > 0 && empDetailsModel[0]?.shiftId) {
                            const empShiftModel = await db.query(
                                `

                                select * from eve_hrm_employee_shift_master
                                where status='A'
                                and id=:id
                        
                                `, {
                                replacements: {
                                    id: empDetailsModel[0].shiftId
                                }
                                , type: QueryTypes.SELECT
                            }
                            )
                            if (empShiftModel.length > 0) {

                                _appDetail.shiftCategory = empShiftModel[0].category


                            }

                        }

                    }

                }

                if ((targetObjOfApproved) && (sandwich_leave.length > 0)) {


                    _appDetail.titleStatus = targetObjOfApproved.type
                    if (targetObjOfApproved.type == "full") {
                        _appDetail.backcolor = "#a4eab0"
                        _appDetail.title = "Present";
                        _appDetail.attStatus = "P"
                        _appDetail.IsApprove = "yes"
                        _appDetail.IsApprove = "yes"
                        getData[i].totalFullDay++
                        statusArray.push(_appDetail.title)

                    }
                    else if (targetObjOfApproved.type == "actualWokrHrs") {
                        // _appDetail.backcolor = "#3333ff"
                        _appDetail.title = "actualWokrHrs";
                        _appDetail.attStatus = "P"
                        _appDetail.IsApprove = "yes"

                        statusArray.push(_appDetail.title)

                    }



                    else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks != "AB LEAVE" && targetObjOfApproved.remarks != "First Half" && targetObjOfApproved.remarks != "Second Half") {
                        _appDetail.attStatus = "AB"
                        _appDetail.backcolor = "#f1bcbc"
                        _appDetail.title = "Absent";
                        _appDetail.IsApprove = "yes"
                        getData[i].totalReject++
                        getData[i].totalAbsent++
                        statusArray.push(_appDetail.title)
                    }




                    else if (targetObjOfApproved.type == "half") {
                        _appDetail.attStatus = "H"
                        _appDetail.backcolor = "#b1b82c"
                        _appDetail.title = "Halfday";
                        _appDetail.IsApprove = "yes"
                        getData[i].totalHalfDay++
                        statusArray.push(_appDetail.title)

                    }




                    else if (targetObjOfApproved.leaveTypeId && targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'L LEAVE' && targetObjOfApproved.leaveTypeId != '') {


                        let leaveResult = await leaveType(targetObjOfApproved.leaveTypeId, db)

                        _appDetail.attStatus = leaveResult.prefix
                        _appDetail.backcolor = leaveResult.colorCode
                        _appDetail.title = leaveResult.name
                        _appDetail.isLeave = true
                        _appDetail.IsApprove = "yes"
                        statusArray.push(_appDetail.title)
                        getData[i].totalPaidLeave++
                        totalPaidLeaveArr.push(
                            leaveResult.prefix
                        )

                        const frequency = totalPaidLeaveArr.reduce((acc, leaveType) => {
                            acc[leaveType] = (acc[leaveType] || 0) + 1;
                            return acc;
                        }, {})

                        const result = Object.entries(frequency).map(([key, value]) => ({ [key]: value }))

                        getData[i].paidLeaveDetails = result

                        if (targetObjOfApproved.flagRemarks == "ForLateClockIn") {
                            _appDetail.title = " For Late ClockIn";
                            _appDetail.lateClockIn = "Leave Deducted For Late ClockIn"
                            _appDetail.IsApprove = "yes"
                            statusArray.push(_appDetail.title)

                        }

                    }




                    else if (targetObjOfApproved.type == "holiday" && targetObjOfApproved.remarks == "L LEAVE" && targetObjOfApproved.leaveTypeId == '') {
                        _appDetail.attStatus = "D-PL"
                        _appDetail.backcolor = "#85eaea"
                        _appDetail.title = "Default Paid Leave";
                        _appDetail.IsApprove = "yes"
                        getData[i].totalPaidLeave++
                        statusArray.push(_appDetail.title)
                    }

                    else if (targetObjOfApproved.type == "reject" && targetObjOfApproved.remarks == "AB LEAVE") {
                        _appDetail.attStatus = "UL"
                        _appDetail.backcolor = "#f17171"
                        _appDetail.title = "Unpaid Leave";
                        _appDetail.IsApprove = "yes"
                        getData[i].totalUnpaidLeave++
                        statusArray.push(_appDetail.title)
                    }



                    else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
                        _appDetail.attStatus = 'HD-PL'
                        _appDetail.backcolor = '#ffa742'
                        _appDetail.title = 'Halfday Paid Leave';
                        _appDetail.IsApprove = "yes"
                        getData[i].totalHalfdayPaidLeave++;
                        statusArray.push(_appDetail.title)
                    }




                    else if (targetObjOfApproved.type == 'reject' && targetObjOfApproved.remarks == 'First Half' || targetObjOfApproved.remarks == 'Second Half') {
                        _appDetail.attStatus = 'HD-UL'
                        _appDetail.backcolor = '#b0f320'
                        _appDetail.title = 'Halfday unpaid Leave';
                        _appDetail.IsApprove = "yes"
                        getData[i].totalHalfdayunpaidLeave++;
                        statusArray.push(_appDetail.title)
                    }



                    else if (targetObjOfApproved.type == 'holiday' && targetObjOfApproved.remarks != 'L LEAVE' && targetObjOfApproved.remarks != 'First Half' && targetObjOfApproved.remarks != 'Second Half') {
                        _appDetail.attStatus = 'MHD'
                        _appDetail.backcolor = '#ccffcc'
                        _appDetail.title = 'Marked as Holiday';
                        _appDetail.IsApprove = "yes"
                        getData[i].totalMarkedAsHoliday++
                        statusArray.push(_appDetail.title)
                        _appDetail.holidayStatus = true
                    }




                    else if (targetObjOfApproved.type == "sunday reject") {
                        _appDetail.attStatus = "AB"
                        _appDetail.backcolor = "#f1bcbc"
                        _appDetail.title = "Absent";
                        _appDetail.IsApprove = "yes"
                        getData[i].totalReject++
                        getData[i].totalAbsent++
                        statusArray.push(_appDetail.title)
                    }


                }

                /***********************************************************/

                else {

                    _appDetail.attStatus = "-";
                    _appDetail.backcolor = "#fff";
                    _appDetail.title = "";
                    statusArray.push(_appDetail.title)

                    if (targetObjOfCompanyHoliday) {
                        _appDetail.backcolor = "#09ff00";
                        _appDetail.IsApprove = "yes"
                        value.holidayArr.push(_appDetail.crtDate)

                        // getData[i].totalHoliDay++
                        getData[i].totalPaidHoliday++



                    }

                    else if (moment(_appDetail.crtDate).format('dddd') == getData[i].fixedWeeklyOffDay) {
                        _appDetail.attStatus = "-";
                        _appDetail.backcolor = "#e8e4e4";
                        _appDetail.title = "Off Day";
                        _appDetail.IsApprove = "yes"
                        _appDetail.weekOff = _appDetail.crtDate
                        statusArray.push(_appDetail.title)

                        // getData[i].totalOffDay++
                        getData[i].totalPaidHoliday++
                    }

                    else if (
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[0]
                        ||
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[1]
                        ||
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[2]
                        ||
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[3]
                        ||
                        moment(_appDetail.crtDate).format('DD') == getData[i].additionalWeeklyOffDay.weeklyHolidayArray[4]

                    ) {
                        _appDetail.attStatus = "-";
                        _appDetail.backcolor = "#e8e4e4";
                        _appDetail.title = "Off Day";
                        _appDetail.IsApprove = "yes"
                        _appDetail.weekOff = _appDetail.crtDate
                        statusArray.push(_appDetail.title)
                        getData[i].totalPaidHoliday++

                    }



                }


                if (_appDetail.type == 'fly') {
                    _appDetail.backcolor = '#e8db68'
                    if (_appDetail.titleStatus === 'full') {
                        _appDetail.fontColor = '#a4eab0'
                        _appDetail.Height = '60px'
                    }
                    else if (_appDetail.titleStatus === 'reject') {
                        _appDetail.fontColor = '#f1bcbc'
                        _appDetail.Height = '60px'
                    }
                    else if (_appDetail.titleStatus === 'holiday') {
                        _appDetail.fontColor = '#09ff00'
                        _appDetail.Height = '60px'
                    }
                    else if (_appDetail.titleStatus === 'half') {
                        _appDetail.fontColor = '#b1b82c'
                        _appDetail.Height = '60px'
                    }

                }


                if (targetObj) {

                    const timeSchedule = await myFunc.getEmployeeWiseOfficeSchedule(value.empId, targetObj.date, db)

                    if (targetObj.intime !== null && targetObj.outTime !== null) {


                        // if (!schedule) return;
                        if (value.multipleClockInClockOut === 'yes') {
                            let { clockInTime, clockOutTime, lunchIn, lunchOut, minWorkingHour } = timeSchedule;
                            const baseDate = targetObj.date;
                            const toMillis = time => new Date(`${baseDate} ${time}`).getTime();

                            const officeIn = toMillis(clockInTime);
                            const officeOut = toMillis(clockOutTime);
                            let lunchInMillis = toMillis(lunchIn)
                            let lunchOutMillis = toMillis(lunchOut)



                            let totalWorkMillis = officeOut > officeIn ? officeOut - officeIn : 0;
                            if (lunchOutMillis > lunchInMillis) totalWorkMillis -= (lunchOutMillis - lunchInMillis);


                            const officetotalWorkHours = moment.utc(totalWorkMillis).format("HH:mm");

                            const multi = await myFunc.getMultiAttendanceWorkingHour(
                                value.empId, targetObj.date, officetotalWorkHours,
                                lunchInMillis, lunchOutMillis, minWorkingHour,
                                targetObj.intime, targetObj.outTime, targetObj.startLunch, targetObj.endLunch, db
                            );

                            let workingHrs, breakHrs;

                          let validate

                            if (multi.startLunch !== null && multi.endLunch !== null) {

                                validate = isLunchInBetween(multi.outime, multi.endLunch)
                                if(!validate){
                                    multi.totalBreakHourMillis=0
                                     lunchOutMillis = 0
                                    lunchInMillis = 0
                                }
                                
                            }
                            else {

                                validate = isLunchInBetween(targetObj.outTime, lunchOut)
                                   if(!validate){
                                    lunchOutMillis=0 
                                    lunchInMillis=0
                                }

                            }

                            let breakMillis
                            if (multi.startLunch === '00:00' && multi.endLunch === '00:00') {
                                breakMillis = multi.totalBreakHourMillis

                            }
                            else {


                                breakMillis = multi.totalBreakHourMillis || (lunchOutMillis - lunchInMillis);
                            }
                            breakHrs = moment.utc(breakMillis).format("HH:mm");

                            let netWorkMillis
                           if (validate && multi.startLunch === null && multi.endLunch === null) {
                                netWorkMillis = multi.totalWorkingHoursMillis > breakMillis
                                    ? multi.totalWorkingHoursMillis - breakMillis
                                    : multi.totalWorkingHoursMillis;

                            }
                            else {
                                netWorkMillis = multi.totalWorkingHoursMillis
                            }
                            workingHrs = moment.utc(netWorkMillis).format("HH:mm");

                            _appDetail.workingHour = workingHrs
                           
                            

                            if (multi.key === 'single') {


                                _appDetail.breakHours = breakHrs
                                breakArr.push(breakHrs);
                            }
                            else {
                                let inOutDiff = myFunc.calculateWorkingHours(targetObj.intime, targetObj.outTime)
                                let break1 = myFunc.calculateWorkingHours(workingHrs, inOutDiff)
                                _appDetail.breakHours = break1
                                breakArr.push(break1);
                            }


                            // _appDetail.breakHours = breakHrs


                            // breakArr.push(breakHrs);


                        }
                    }
                    // }





                    if (_appDetail.intime !== '') {
                        if (timeSchedule && timeSchedule.lateTimeEnd) {
                            if (moment(_appDetail.intime, 'HH:mm').isAfter(moment(timeSchedule.lateTimeEnd, 'HH:mm'))) {
                                _appDetail.lateAttendanceForLToolTip = 'Late Punch In';
                                _appDetail.lateAttendanceForLValue = 'L';
                            }
                        } else {
                            let company = await db1.query(
                                `
                            SELECT * FROM eve_main_company
                            WHERE status = 'A' AND id = :id
                            `,
                                {
                                    replacements: { id: tokenCompanyId },
                                    type: QueryTypes.SELECT
                                }
                            );

                            if (company.length > 0 && company[0].lateTimeEnd) {
                                if (moment(_appDetail.intime, 'HH:mm').isAfter(moment(company[0].lateTimeEnd, 'HH:mm'))) {
                                    _appDetail.lateAttendanceForLToolTip = 'Late Punch In';
                                    _appDetail.lateAttendanceForLValue = 'L';
                                }
                            }
                        }
                    }
                }

                // const lateTimeEnd = await myFunc.getEmployeeWiseOfficeSchedule(value.empId, _appDetail.crtDate, db)
                //     || await myFunc.getCompanyLateTimeEnd(db1, tokenCompanyId);

                // if (_appDetail.intime !== '' && lateTimeEnd) {
                //     const isLate = moment(_appDetail.intime, 'HH:mm').isAfter(moment(lateTimeEnd, 'HH:mm'));
                //     if (isLate) {
                //         _appDetail.lateAttendanceForLToolTip = 'Late Punch In';
                //         _appDetail.lateAttendanceForLValue = 'L';
                //     }
                // }







                value.appDetails = _appDetailsObj

            }
            let isAllHalfday = statusArray.length === NoOfdaysInMonth && statusArray.every(value => value === 'Halfday');

            if (isAllHalfday) {
                value.status = 'Half Day Approved'
            }

            let isAllPresent = statusArray.length === NoOfdaysInMonth && statusArray.every(value => value === 'Present');

            if (isAllPresent) {
                value.status = 'Full Day Approved'
            }


            value.totalBreakHour = myFunc.addTimes(breakArr)

        }

        // TotalWorkingHours
        let formattedHours
        let formattedMinutes

        for (let i = 0; i < getData.length; i++) {
            let value = []
            for (let j = 0; j < NoOfdaysInMonth; j++) {
                if (getData[i].appDetails[j].workingHour != '--') {
                    value.push(getData[i].appDetails[j].workingHour)
                }
            }

            const totalMinutes = value.reduce((sum, time) => {
                const [hours, minutes] = typeof time === 'string' ? time.split(":").map(Number) : [0, 0]
                return sum + hours * 60 + minutes;
            }, 0);

            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60;
            formattedHours = String(hours).padStart(2, "0");
            formattedMinutes = String(minutes).padStart(2, "0")

            getData[i].totalWorkingHour = `${formattedHours}:${formattedMinutes}`;






        }


        //workingHour

        function subtractTime(time1, time2) {
            // Parse time strings into hour and minute components
            const [hour1, minute1] = time1.split(':').map(Number);
            const [hour2, minute2] = time2.split(':').map(Number);

            // Convert hour and minute components into total minutes
            const totalMinutes1 = hour1 * 60 + minute1;
            const totalMinutes2 = hour2 * 60 + minute2;

            // Subtract the total minutes of the second time from the first time
            let diffMinutes = totalMinutes1 - totalMinutes2;

            if (diffMinutes < 0) {
                // If the result is negative, assume we are crossing midnight and add 24 hours worth of minutes
                diffMinutes += 24 * 60;
            }

            // Convert the result back to the "hh:mm" format
            const diffHours = Math.floor(diffMinutes / 60);
            const diffMins = diffMinutes % 60;

            // Add leading zeros for single-digit hours/minutes
            const formattedDiff = `${String(diffHours).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
            return formattedDiff;
        }




        function convertTimeToMinutes(time) {
            const [hour, minute] = time.split(':').map(Number);
            const totalMinutes = hour * 60 + minute;
            return totalMinutes;
        }

        for (let i = 0; i < getData.length; i++) {

            let n = getData[i].inOutArr.length

            for (let j = 0; j < n; j++) {

                let time1 = getData[i].inOutArr[j].outTime
                let time2 = getData[i].inOutArr[j].inTime

                getData[i].inOutArr[j].workingHourInMin = subtractTime(time1, time2)
                getData[i].inOutArr[j].workingHourInMin = convertTimeToMinutes(getData[i].inOutArr[j].workingHourInMin)



            }
        }


        //NetPaidDays
        let totalPresent = 0
        let totalHalfDay = 0
        let totalAbsent = 0
        let totalPaidLeave = 0
        let totalUnpaidLeave = 0
        getData.map((e) => {
            e.NetPaidDays = NoOfdaysInMonth.toString()
            if (e.branchName == null) {
                e.branchName = ''
            }
            if (e.empCode == null) {
                e.empCode = ''
            }
            if (e.deptId == null) {
                e.deptId = ''
            }
            if (e.designId == null) {
                e.designId = ''
            }
            if (e.subDepartmentId == null) {
                e.subDepartmentId = ''
            }
            if (e.location == null) {
                e.location = ''
            }
            timeArr.push(e.totalWorkingHour)
            totalPresent += parseInt(e.totalFullDay)
            totalHalfDay += parseInt(e.totalHalfDay)
            totalAbsent += parseInt(e.totalAbsent)
            totalPaidLeave += parseInt(e.totalPaidLeave)
            totalUnpaidLeave += parseInt(e.totalUnpaidLeave)
        })



        totalWork = addTimes(timeArr)
        totalActualShift = addTimes(shiftArr)

        // let totalSalaryExpenses = 0
        // for (let i = 0; i < getData.length; i++) {
        //     getData[i].totalPaidHoliday = (getData[i].totalPaidHoliday) - (getData[i].totalRejectedSunday)
        //     getData[i].totalPaidHoliday = `0${getData[i].totalPaidHoliday.toString()}`
        //     let e = getData[i]
        // }
        const excelData = getData.map((e) => {
            return {
                'Sl No': e.slno,
                'Employee Code': e.empCode,
                'Employee Name': e.empName,
                'Sub Company': e.subCompanyName,
                'Branch Name': e.branchName,
                'App': e.appDetails,
                'Total Work Hours': e.totalWorkingHour,
                'Total Break Hours': e.totalBreakHour,
                'Total Present Day': e.totalFullDay,
                'Total Half Day': e.totalHalfDay,
                'Total Absent': e.totalAbsent,
                'Total Paid Leave': e.totalPaidLeave,
                'Total Unpaid Leave': e.totalUnpaidLeave,
            }
        })

        return res.status(200).send({
            recordedPerPage: limit,
            currentPage: pageNo,
            // totalData: limit,
            totalData: totalData,
            // dateArr: dateArr,
            // leaveHeader: totalLeave,
            // totalWork: totalWork,
            // totalActualShift: totalActualShift,
            // totalPresent: totalPresent,
            // totalHalfDay: totalHalfDay,
            // totalAbsent: totalAbsent,
            // totalPaidLeave: totalPaidLeave,
            // totalUnpaidLeave: totalUnpaidLeave,
            // totalSalaryExpenses: totalSalaryExpenses,
            // isCompanySelfieActivate: 'yes',
            // isCompanySelfieActivate: isCompanySelfieActivate,
            // employee: getData,
            employee: myFunc.replaceEmptyValues(excelData),

        })



    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message, msg1: error.stack })
    }
}
async function fetchData({ token, year, month, userrole, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category, pageType }) {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                // 'Cookie': `x-cross-auth=${(token)}`
                  'x-cross-auth': token

            },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getMonthlyAttendanceWcExcel`,

            data: { token, year, month, userrole, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category, pageType }
        }
        const response = await axios(config)
        return response.data;
    } catch (error) {
        throw error;
    }
}
// function getColumnLetter(columnNumber) {
//     let columnName = '';
//     while (columnNumber > 0) {
//         let remainder = (columnNumber - 1) % 26;
//         columnName = String.fromCharCode(65 + remainder) + columnName;
//         columnNumber = Math.floor((columnNumber - 1) / 26);
//     }
//     return columnName;
// }


async function createExcelFile(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    let values = []
    let employee = data.employee
    let header = Object.keys(employee[0])
    let subHeader = []
    let midHeader = []

    let appIndex = header.indexOf('App')

    let mergeColumn = []



    employee[0].App.forEach((e, i) => {
        midHeader.push(myFunc.convertDateDDMMYYYY(e.crtDate), myFunc.convertDateDDMMYYYY(e.crtDate), myFunc.convertDateDDMMYYYY(e.crtDate), myFunc.convertDateDDMMYYYY(e.crtDate))
        subHeader.push('In Time', 'Out Time', 'Status', 'Device Name')

        // let startColumn = (appIndex + 1) + (i * 4)
        // let endColumn = (startColumn + 3)
        // let endRow = 1
        // let startRow = 1
        // mergeColumn.push(`${getColumnLetter(startColumn)}1:${getColumnLetter(endColumn)}1`)
        // worksheet.mergeCells(`${getColumnLetter(startColumn)}2:${getColumnLetter(endColumn)}2`)
    })

    // console.log(mergeColumn);

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
                    row.push(z.intime, z.outTime, z.title, z.deviceName)
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
    // let totalActualIndex = header.indexOf('Actual Shift Hours') + 1;
    let totalPresent = header.indexOf('Total Absent') + 1;
    let totalHalfDay = header.indexOf('Total Half Day') + 1;
    let totalAbsent = header.indexOf('Total Absent') + 1;
    let totalPaidLeave = header.indexOf('Total Paid Leave') + 1;
    let totalUnpaidLeave = header.indexOf('Total Unpaid Leave') + 1;
    // let status = header.indexOf('Status') + 1;
    // let total = header.indexOf('Sl. No.') + 1; // Adjusted as ExcelJS is 1-based

    // Log indices for debugging


    // Prepare data row with appropriate length
    let len = header.length;
    let row = new Array(len).fill('');

    // Assign data values to their respective indices
    // row[totalWorkIndex - 1] = data['totalWork']; // Use 0-based for array
    // row[totalActualIndex - 1] = data['totalActualShift'];
    // row[totalPresent - 1] = data['totalPresent'];
    // row[totalHalfDay - 1] = data['totalHalfDay'];
    // row[totalAbsent - 1] = data['totalAbsent'];
    // row[totalPaidLeave - 1] = data['totalPaidLeave'];
    // row[totalUnpaidLeave - 1] = data['totalUnpaidLeave'];
    // row[total - 1] = 'TOTAL';

    // Push the row into values array
    // values.push(row);

    // Add the values to the worksheet
    worksheet.addRows(values);

    // Merge cells as required
    mergeColumn.forEach((e) => {
        worksheet.mergeCells(e);
    });

    //// Setting cell values using calculated indices
    worksheet.getCell(2, totalWorkIndex).value = '';
    // worksheet.getCell(2, totalActualIndex).value = '';
    worksheet.getCell(2, totalPresent).value = '';
    worksheet.getCell(2, totalHalfDay).value = '';
    worksheet.getCell(2, totalAbsent).value = '';
    worksheet.getCell(2, totalPaidLeave).value = '';
    worksheet.getCell(2, totalUnpaidLeave).value = '';
    // worksheet.getCell(2, status).value = '';


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

            row.height = 15

        });
    });
    headerRow.eachCell(cell => {
        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });
    // headerRow2.eachCell(cell => {
    // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
    // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
    // cell.font = { bold: true };

    // });

    worksheet.columns.forEach(column => {
        column.width = 20;
    });


    // const lastRow = worksheet.lastRow;
    // lastRow.eachCell((cell, colNumber) => {
    //     cell.font = { bold: true };
    // });


    return workbook.xlsx
}

async function getMonthlyAttendanceWcExcelSheet(req, res) {
    try {
        // let token = req.cookies["x-cross-auth"] || req.query["x-cross-auth"]
           let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let year = (req.body.year || req.query.year)
        let month = (req.body.month || req.query.month)
        let limit = (req.body.limit || req.query.limit)
        let pageNo = (req.body.pageNo || req.query.pageNo)
        let empCode = (req.body.empCode || req.query.empCode)
        let empName = (req.body.empName || req.query.empName)
        let branchId = (req.body.branchId || req.query.branchId)
        let deptId = (req.body.deptId || req.query.deptId)
        let designId = (req.body.designId || req.query.designId)
        let subCompanyId = (req.body.subCompanyId || req.query.subCompanyId)
        let subDepartmentId = (req.body.subDepartmentId || req.query.subDepartmentId)
        let location = (req.body.location || req.query.location)
        let userrole = (req.body.userrole || req.query.userrole)
        let empType = (req.body.empType || req.query.empType)
        let category = (req.body.category || req.query.category)
        let pageType = (req.body.pageType || req.query.pageType)

        let apiData = await fetchData({ token, year, userrole, month, limit, pageNo, empCode, empName, branchId, deptId, designId, subCompanyId, subDepartmentId, location, empType, category, pageType })


        let getExcel = createExcelFile(apiData)


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="monthlyAttendanceWc.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, error: error.stack })
    }
}

module.exports = { getMonthlyAttendanceWcExcel, getMonthlyAttendanceWcExcelSheet }

// function isLunchInBetween(intime, outime, startLunch) {
//     // Helper to convert HH:mm or H:mm to minutes
//     if (!startLunch) {
//         return true
//     }
//     const toMinutes = (timeStr) => {
//         const [h, m] = timeStr.split(':').map(Number);
//         return h * 60 + m;
//     };

//     const inMin = toMinutes(intime);
//     const outMin = toMinutes(outime);
//     const lunchMin = toMinutes(startLunch);

//     return lunchMin >= inMin && lunchMin <= outMin;
// }

function isLunchInBetween(outime, endLunch) {
    if (!endLunch) {
        return true
    }

    const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const outMin = toMinutes(outime);
    const endLunchMin = toMinutes(endLunch);

    return outMin > endLunchMin;
}