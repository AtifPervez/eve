let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')


const getOvertimeReportsWc = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)

        let sqlQuery = await db.query(
            `
               SELECT employeeSubCompanyId,employeeBranchId
               FROM eve_acc_employee
               WHERE status='A'
               AND id=:id 
            `, {
            replacements: { id: tokenUserId }, type: QueryTypes.SELECT
        }
        )
        const tokenSubCompanyId = sqlQuery[0]['employeeSubCompanyId']
        // const tokenBranchUserId = sqlQuery[0]['employeeBranchId']




        let data = req.body
        let { year, month, empCode, empId, subCompId, branchId, departmentId, subDepartmentId, locationID, sortOrder, designation } = data

        sortOrder = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        let countQuery = await db.query(`
                                       SELECT COUNT(*) AS total
                                       FROM eve_acc_employee AS a
        LEFT JOIN eve_acc_employee_overtime_report AS b ON (b.empId=a.id)
      
        WHERE a.status='A'

            AND a.employeeSubCompanyId=:tokenSubCompanyId
              AND a.employeeBranchId=:tokenBranchId

        AND a.isOvertimeApplicable='yes'
        AND (a.employeeType ='' OR a.employeeType IS NULL OR a.employeeType='White Collar')
        AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
        AND (:id IS NULL OR a.id=:id)
        AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId=:employeeSubCompanyId)
        AND (:employeeBranchId IS NULL OR a.employeeBranchId=:employeeBranchId)
        AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId=:employeeDepartmentId)
        AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId=:employeeSubDepartmentId)
        AND (:designation  IS NULL OR a.employeeDesignationId=:designation )
        AND (:locationID IS NULL OR a.locationID=:locationID)
        AND (a.employeeCurrentStatus = '' 
        OR a.employeeCurrentStatus IS NULL 
        OR a.employeeCurrentStatus = 'Active'
        OR a.employeeCurrentStatus = 'resignation' 
        OR a.employeeCurrentStatus = 'joining'
        OR a.employeeCurrentStatus = 'termination'
        OR a.employeeCurrentStatus = 'release' 
        OR a.employeeCurrentStatus = 'offerletter')

          AND (
              b.appriserId=:tokenUserId
              OR
              b.appriserId=:tokenUserId
              OR
              b.managerId=:tokenUserId
              )

                                     
                                       
                                       
        `, {
            replacements: {
                employeeCode: empCode || null,
                id: empId || null,
                employeeSubCompanyId: subCompId || null,
                employeeBranchId: branchId || null,
                employeeDepartmentId: departmentId || null,
                employeeSubDepartmentId: subDepartmentId || null,
                locationID: locationID || null,
                designation: designation || null,
                tokenSubCompanyId: tokenSubCompanyId,
                tokenBranchId: tokenBranchId,
                tokenUserId: tokenUserId
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



        //        let getData = await db.query(`
        //     SELECT
        //         (@row_number := @row_number + 1) AS slno,
        //         a.id AS empId,
        //         a.employeeName,
        //         a.employeeCode,
        //         a.employeeSubCompanyId,
        //         a.employeeBranchId,
        //         a.employeeDepartmentId,
        //         a.employeeSubDepartmentId,
        //         a.employeeDesignationId,
        //         a.locationID,
        //         a.employeeType,
        //         b.appriserId,
        //         b.reviewerId,
        //         b.managerId
        //     FROM eve_acc_employee AS a
        //     LEFT JOIN eve_acc_employee_overtime_report AS b ON (b.empId=a.id)
        //     WHERE a.status='A'
        //       AND a.employeeSubCompanyId=:tokenSubCompanyId
        //       AND a.employeeBranchId=:tokenBranchUserId
        //       AND (
        //           b.appriserId=:tokenUserId
        //        OR b.reviewerId=:tokenUserId
        //        OR b.managerId=:tokenUserId
        //       )
        //       AND a.isOvertimeApplicable='yes'
        //       AND (a.employeeType ='' OR a.employeeType IS NULL OR a.employeeType='White Collar')
        //       AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
        //       AND (:id IS NULL OR a.id=:id)
        //       AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId=:employeeSubCompanyId)
        //       AND (:employeeBranchId IS NULL OR a.employeeBranchId=:employeeBranchId)
        //       AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId=:employeeDepartmentId)
        //       AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId=:employeeSubDepartmentId)
        //       AND (:locationID IS NULL OR a.locationID=:locationID)
        //       AND (
        //           a.employeeCurrentStatus = '' 
        //           OR a.employeeCurrentStatus IS NULL 
        //           OR a.employeeCurrentStatus = 'Active'
        //           OR a.employeeCurrentStatus = 'resignation' 
        //           OR a.employeeCurrentStatus = 'joining'
        //           OR a.employeeCurrentStatus = 'termination'
        //           OR a.employeeCurrentStatus = 'release' 
        //           OR a.employeeCurrentStatus = 'offerletter'
        //       )
        //     ORDER BY a.employeeName ${sortOrder}
        //     LIMIT :limit
        //     OFFSET :offset
        // `, {
        //     replacements: {
        //         limit,
        //         offset,
        //         employeeCode: empCode || null,
        //         id: empId || null,
        //         employeeSubCompanyId: subCompId || null,
        //         employeeBranchId: branchId || null,
        //         employeeDepartmentId: departmentId || null,
        //         employeeSubDepartmentId: subDepartmentId || null,
        //         locationID: locationID || null,
        //         tokenSubCompanyId,
        //         tokenBranchUserId,
        //         tokenUserId
        //     },
        //     type: QueryTypes.SELECT
        // });

        let getData = await db.query(`
    SELECT 
        (@row_number := @row_number + 1) AS slno,
        empId,
        employeeName,
        multipleClockInClockOut,
        employeeCode,
        employeeSubCompanyId,
        employeeBranchId,
        employeeDepartmentId,
        employeeSubDepartmentId,
        employeeDesignationId,
        locationID,
        employeeType,
        appriserId,
        reviewerId,
        managerId
    FROM (
        SELECT 
            a.id AS empId,
            a.multipleClockInClockOut,
            a.employeeName,
            a.employeeCode,
            a.employeeSubCompanyId,
            a.employeeBranchId,
            a.employeeDepartmentId,
            a.employeeSubDepartmentId,
            a.employeeDesignationId,
            a.locationID,
            a.employeeType,
            b.appriserId,
            b.reviewerId,
            b.managerId
        FROM eve_acc_employee AS a
        LEFT JOIN eve_acc_employee_overtime_report AS b ON b.empId = a.id
        WHERE a.status = 'A'
          AND a.employeeSubCompanyId = :tokenSubCompanyId
          AND a.employeeBranchId = :tokenBranchId
          AND (
              b.appriserId = :tokenUserId
              OR b.reviewerId = :tokenUserId
              OR b.managerId = :tokenUserId
          )
          AND a.isOvertimeApplicable = 'yes'
          AND (
              a.employeeType = '' OR a.employeeType IS NULL OR a.employeeType = 'White Collar'
          )
          AND (:employeeCode IS NULL OR a.employeeCode = :employeeCode)
          AND (:id IS NULL OR a.id = :id)
          AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId = :employeeSubCompanyId)
           AND (:designation  IS NULL OR a.employeeDesignationId=:designation )
          AND (:employeeBranchId IS NULL OR a.employeeBranchId = :employeeBranchId)
          AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId = :employeeDepartmentId)
          AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId = :employeeSubDepartmentId)
          AND (:locationID IS NULL OR a.locationID = :locationID)
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
        ORDER BY a.employeeName ${sortOrder}
        LIMIT :limit OFFSET :offset
    ) AS sub
    CROSS JOIN (SELECT @row_number := 0) AS init
    ORDER BY slno
`, {
            replacements: {
                limit,
                offset,
                employeeCode: empCode || null,
                id: empId || null,
                employeeSubCompanyId: subCompId || null,
                employeeBranchId: branchId || null,
                employeeDepartmentId: departmentId || null,
                employeeSubDepartmentId: subDepartmentId || null,
                locationID: locationID || null,
                designation: designation || null,
                tokenSubCompanyId,
                tokenBranchId,
                tokenUserId
            },
            type: QueryTypes.SELECT
        });




        let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

        await Promise.all(getData.map(async (e, i) => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.employeeType = e.employeeType === null ? 'White Collar' : e.employeeType
            e.employeeCode = e.employeeCode === null ? '' : e.employeeCode

            const appDetailsObj = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {

                let number = i.toString().padStart(2, '0');
                let empDtStrdate = new Date(`${year}-${month}-${number}`)
                let timestamp = Math.floor(empDtStrdate.getTime() / 1000)

                let newObj = {
                    crtDate: `${year}-${month}-${number}`,
                    intime: "--",
                    outTime: "--",
                    workingHour: '--',
                    attStatus: "--",
                    empDtStr: `${timestamp}`,
                    backcolor: "--",
                    title: "--",
                    approvedOtHrs: '--',
                    rejectOtHrs: '--',
                    actualOtHrs: '--',
                    officeSchedulehrs: '--',

                };
                appDetailsObj.push(newObj);
            }
            e.appDetails = appDetailsObj

            let empAttendance = await db.query(`
                                            SELECT 
                                            empId,
                                            date,
                                            intime,
                                            outTime,startLunch,endLunch
                                           
                                            FROM eve_acc_employee_attendence 
                                            WHERE status='A' 
                                            AND empId=:empId
                                            AND intime IS NOT NULL
                                            AND outTime IS NOT NULL
                                            AND YEAR(date) = :year
                                            AND MONTH(date) = :month
                                            
                                            
                                            
            `, {
                replacements: {
                    empId: e.empId,
                    year: year,
                    month: month,
                },

                type: QueryTypes.SELECT
            })


            let totalWorkingMinutes = 0;
            let totalActualOtHrsArr = [];

            let attendanceMap = new Map()

            empAttendance.map(record => attendanceMap.set(record.date, record))
            await Promise.all(e.appDetails.map(async detail => {
                if (attendanceMap.has(detail.crtDate)) {

                    let attendanceRecord = attendanceMap.get(detail.crtDate);
                    detail.intime = attendanceRecord.intime
                    detail.outTime = attendanceRecord.outTime



                    let a = await myFunc.getEmployeeWiseOfficeSchedule(e.empId, attendanceRecord.crtDate, db)


                    if (a && a.clockInTime && a.clockOutTime) {

                        if (e.multipleClockInClockOut === 'yes') {

                            let officeSchedulehrs = myFunc.calculateWorkingHours(a.clockInTime, a.clockOutTime);
                            let officeLunch = myFunc.calculateWorkingHours(a.lunchIn, a.lunchOut)
                            detail.officeSchedulehrs = myFunc.subtractTime(officeLunch, officeSchedulehrs);
                        }
                        else {
                            detail.officeSchedulehrs = myFunc.calculateWorkingHours(a.clockInTime, a.clockOutTime);
                        }


                    }
                    if (detail.intime != '' && detail.outTime != '') {



                        if (e.multipleClockInClockOut === 'yes') {

                            let { clockInTime, clockOutTime, lunchIn, lunchOut, minWorkingHour } = a;
                            const baseDate = attendanceRecord.date;
                            const toMillis = time => new Date(`${baseDate} ${time}`).getTime();

                            // lunchIn=lunchIn===':'?0:lunchIn
                            // lunchOut=lunchOut===':'?0:lunchOut


                            const officeIn = toMillis(clockInTime);
                            const officeOut = toMillis(clockOutTime);
                            let lunchInMillis = toMillis(lunchIn);
                            let lunchOutMillis = toMillis(lunchOut);
                            let totalWorkMillis = officeOut > officeIn ? officeOut - officeIn : 0;
                            if (lunchOutMillis > lunchInMillis) totalWorkMillis -= (lunchOutMillis - lunchInMillis);

                            const officetotalWorkHours = moment.utc(totalWorkMillis).format("HH:mm");
                            const multi = await myFunc.getMultiAttendanceWorkingHour(
                                e.empId, attendanceRecord.date, officetotalWorkHours,
                                lunchInMillis, lunchOutMillis, minWorkingHour,
                                attendanceRecord.intime, attendanceRecord.outTime, attendanceRecord.startLunch, attendanceRecord.endLunch, db
                            );

                            let workingHrs, breakHrs;

                             let validate

                        if (multi.startLunch !== null && multi.endLunch !== null) {


                            validate = isLunchInBetween(multi.outime, multi.endLunch)
                            if (!validate) {
                                multi.totalBreakHourMillis = 0
                                lunchOutMillis = 0
                                lunchInMillis = 0


                            }
                          
                        }
                        else {

                            validate = isLunchInBetween(detail.outTime, lunchOut)
                            if (!validate) {
                                lunchOutMillis = 0
                                lunchInMillis = 0
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


                            detail.workingHour = workingHrs

                        }
                        else {

                            detail.workingHour = myFunc.calculateWorkingHours(detail.intime, detail.outTime)
                        }
                    }

                    if (detail.workingHour > detail.officeSchedulehrs) {

                        if (detail.workingHour !== '--' && detail.officeSchedulehrs !== '--') {
                            detail.actualOtHrs = myFunc.subtractTime(detail.officeSchedulehrs, detail.workingHour)




                        }
                    }
                    if (detail.actualOtHrs !== '--') {

                        totalActualOtHrsArr.push(detail.actualOtHrs)

                    }






                    // if (detail.intime < detail.outTime) {

                    //     let [inHours, inMinutes] = detail.intime.split(':').map(Number);
                    //     let [outHours, outMinutes] = detail.outTime.split(':').map(Number);

                    //     let inDate = new Date()
                    //     inDate.setHours(inHours, inMinutes, 0)
                    //     let outDate = new Date()
                    //     outDate.setHours(outHours, outMinutes, 0)
                    //     let diffMs = outDate - inDate
                    //     let diffHours = Math.floor(diffMs / 3600000)
                    //     let diffMinutes = Math.floor((diffMs % 3600000) / 60000)

                    //     let totalDiffHrs
                    //     let totalDiffMins = diffMinutes

                    //     if (diffMinutes < 10) {
                    //         totalDiffMins = diffMinutes
                    //         diffMinutes = `0${diffMinutes}`
                    //     }

                    //     if (diffHours > 9) {
                    //         diffHours = diffHours - 9
                    //         totalDiffHrs = diffHours

                    //         if (diffHours < 10) {
                    //             diffHours = `0${diffHours}`
                    //         }

                    //         detail.workingHour = `${diffHours}:${diffMinutes}`
                    //         detail.actualOtHrs = `${diffHours}:${diffMinutes}`

                    //         totalWorkingMinutes += totalDiffHrs * 60 + totalDiffMins;

                    //     }

                    // }

                }
                // const totalHours = Math.floor(totalWorkingMinutes / 60);
                // const totalMinutes = totalWorkingMinutes % 60;
                // const totalWorkingHrs = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}`;

                // e.totalActualOtHrs = totalWorkingHrs;

            }))
            e.totalActualOtHrs = myFunc.addTimes(totalActualOtHrsArr)

            let empAttendanceApproved = await db.query(`
                       SELECT *
                       FROM eve_acc_employee_overtime_approved
                       WHERE status='A'
                       AND employeeId=:employeeId
                        -- AND type IS NOT NULL
                        -- AND editOTday IS NOT NULL
                       AND YEAR(date) = :year
                       AND MONTH(date) = :month
                       `, {
                replacements: {
                    employeeId: e.empId,
                    year: year,
                    month: month
                },
                type: QueryTypes.SELECT
            })

            let totalApprovedOtMinutes = 0
            let totalRejectOtMinutes = 0

            let attendanceApprovedMap = new Map()
            empAttendanceApproved.map(x => attendanceApprovedMap.set(x.date, x))

            e.appDetails.map(x => {

                if (attendanceApprovedMap.has(x.crtDate)) {

                    let attendanceApprovedRecord = attendanceApprovedMap.get(x.crtDate)

                    if (attendanceApprovedRecord.type === 'Approve') {
                        if (attendanceApprovedRecord.editOTday) {

                            x.approvedOtHrs = attendanceApprovedRecord.editOTday
                        }
                        else if (attendanceApprovedRecord.workingHour) {
                            x.approvedOtHrs = attendanceApprovedRecord.workingHour
                        }
                        if (x.approvedOtHrs != '--' && x.approvedOtHrs != '00.00') {
                            const [otHours, otMinutes] = x.approvedOtHrs.split(':').map(Number);
                            totalApprovedOtMinutes += otHours * 60 + otMinutes;
                        }


                    }
                    else if (attendanceApprovedRecord.type === 'Reject') {
                        if (attendanceApprovedRecord.editOTday) {
                            x.rejectOtHrs = attendanceApprovedRecord.editOTday
                        }
                        else if (attendanceApprovedRecord.workingHour) {
                            x.rejectOtHrs = attendanceApprovedRecord.workingHour
                        }

                        if (x.rejectOtHrs != '--' && x.rejectOtHrs != '00.00') {

                            const [otHours, otMinutes] = x.rejectOtHrs.split(':').map(Number);
                            totalRejectOtMinutes += otHours * 60 + otMinutes;


                        }

                    }
                }
            })
            const totalOtHours = Math.floor(totalApprovedOtMinutes / 60);
            const totalOtMinutes = totalApprovedOtMinutes % 60;
            const totalApprovedOtHrs = `${String(totalOtHours).padStart(2, '0')}:${String(totalOtMinutes).padStart(2, '0')}`;
            e.totalApprovedOtHrs = roundDownToHour(totalApprovedOtHrs)

            let totalRejectOtHrs = Math.floor(totalRejectOtMinutes / 60)
            let totalRejectOtMins = totalRejectOtMinutes % 60
            let totalRejectedOtHrs = `${String(totalRejectOtHrs).padStart(2, '0')}:${String(totalRejectOtMins).padStart(2, '0')}`;
            e.totalRejectedOtHrs = totalRejectedOtHrs;

            e.totalActualOtHrs = e.totalActualOtHrs === '00:00' ? '--:--' : e.totalActualOtHrs
            e.totalApprovedOtHrs = e.totalApprovedOtHrs === '00:00' ? '--:--' : e.totalApprovedOtHrs
            e.totalRejectedOtHrs = e.totalRejectedOtHrs === '00:00' ? '--:--' : e.totalRejectedOtHrs






        }))
        return res.status(200).json({
            status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData, employee: getData
        })


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getOvertimeReportsWc }


function roundDownToHour(timeStr) {
    const [hours, _] = timeStr.split(":");
    return `${hours.padStart(2, '0')}:00`;
}

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
