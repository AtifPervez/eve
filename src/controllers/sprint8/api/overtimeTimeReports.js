let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')


const getOvertimeReport = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)

        let data = req.body
        let { year, month, empCode, empId, subCompId, branchId, departmentId, subDepartmentId, locationID,sortOrder } = data

sortOrder = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        let countQuery = await db.query(`
                                       SELECT COUNT(*) AS total
                                       FROM eve_acc_employee
                                       WHERE status='A'
                                       AND isOvertimeApplicable='yes'
                                       AND employeeType='Blue Collar'
                                       AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
                                       AND (:id IS NULL OR id=:id)
                                       AND (:employeeSubCompanyId IS NULL OR employeeSubCompanyId=:employeeSubCompanyId)
                                       AND (:employeeBranchId IS NULL OR employeeBranchId=:employeeBranchId)
                                       AND (:employeeDepartmentId IS NULL OR employeeDepartmentId=:employeeDepartmentId)
                                       AND (:employeeSubDepartmentId IS NULL OR employeeSubDepartmentId=:employeeSubDepartmentId)
                                       AND (:locationID IS NULL OR locationID=:locationID)
                                       AND (employeeCurrentStatus = '' 
                                       OR employeeCurrentStatus IS NULL 
                                       OR employeeCurrentStatus = 'Active'
                                       OR employeeCurrentStatus = 'resignation' 
                                       OR employeeCurrentStatus = 'joining'
                                       OR employeeCurrentStatus = 'termination'
                                       OR employeeCurrentStatus = 'release' 
                                       OR employeeCurrentStatus = 'offerletter')
                                       
                                       
        `, {
            replacements: {
                employeeCode: empCode || null,
                id: empId || null,
                employeeSubCompanyId: subCompId || null,
                employeeBranchId: branchId || null,
                employeeDepartmentId: departmentId || null,
                employeeSubDepartmentId: subDepartmentId || null,
                locationID: locationID || null,
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
        (@row_number:=@row_number + 1) AS slno,
        id AS empId,
        employeeName,
        employeeCode,
        employeeSubCompanyId,
        employeeBranchId,
        employeeDepartmentId,
        employeeSubDepartmentId,
        locationID,
        employeeType
        FROM eve_acc_employee
        CROSS JOIN (SELECT @row_number := :offset) AS init
        WHERE status='A'
        AND isOvertimeApplicable='yes'
        AND employeeType='Blue Collar'
        AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
        AND (:id IS NULL OR id=:id)
        AND (:employeeSubCompanyId IS NULL OR employeeSubCompanyId=:employeeSubCompanyId)
        AND (:employeeBranchId IS NULL OR employeeBranchId=:employeeBranchId)
        AND (:employeeDepartmentId IS NULL OR employeeDepartmentId=:employeeDepartmentId)
        AND (:employeeSubDepartmentId IS NULL OR employeeSubDepartmentId=:employeeSubDepartmentId)
        AND (:locationID IS NULL OR locationID=:locationID)
        AND (employeeCurrentStatus = '' 
        OR employeeCurrentStatus IS NULL 
        OR employeeCurrentStatus = 'Active'
        OR employeeCurrentStatus = 'resignation' 
        OR employeeCurrentStatus = 'joining'
        OR employeeCurrentStatus = 'termination'
        OR employeeCurrentStatus = 'release' 
        OR employeeCurrentStatus = 'offerletter')
        ORDER BY employeeName ${sortOrder}
        LIMIT :limit
        OFFSET :offset`,
            {
                replacements: {
                    limit: limit,
                    offset: offset,
                    employeeCode: empCode || null,
                    id: empId || null,
                    employeeSubCompanyId: subCompId || null,
                    employeeBranchId: branchId || null,
                    employeeDepartmentId: departmentId || null,
                    employeeSubDepartmentId: subDepartmentId || null,
                    locationID: locationID || null,
                },
                type: QueryTypes.SELECT
            })


        let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)

        await Promise.all(getData.map(async (e, i) => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.locationName = await myFunc.getLocationNameById(e.locationID, db)
            e.employeeType = e.employeeType === null ? 'White Collar' : e.employeeType
            e.employeeCode = e.employeeCode === null ? '' : e.employeeCode

            const appDetailsObj = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {

                let number = i.toString().padStart(2, '0');
                let empDtStrdate = new Date(`${year}-${month}-${number}`);
                let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

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

                };
                appDetailsObj.push(newObj);
            }
            e.appDetails = appDetailsObj

            let empAttendance = await db.query(`
                                            SELECT 
                                            empId,
                                            date,
                                            intime,
                                            outTime
                                           
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

            let attendanceMap = new Map()

            empAttendance.map(record => attendanceMap.set(record.date, record))
            e.appDetails.map(detail => {
                if (attendanceMap.has(detail.crtDate)) {

                    let attendanceRecord = attendanceMap.get(detail.crtDate);
                    detail.intime = attendanceRecord.intime
                    detail.outTime = attendanceRecord.outTime
                    if (detail.intime < detail.outTime) {

                        let [inHours, inMinutes] = detail.intime.split(':').map(Number);
                        let [outHours, outMinutes] = detail.outTime.split(':').map(Number);

                        let inDate = new Date();
                        inDate.setHours(inHours, inMinutes, 0);
                        let outDate = new Date();
                        outDate.setHours(outHours, outMinutes, 0);


                        let diffMs = outDate - inDate;
                        


                        let diffHours = Math.floor(diffMs / 3600000);
                      
                        let diffMinutes = Math.floor((diffMs % 3600000) / 60000);
                        

                        let totalDiffHrs
                         let totalDiffMins=diffMinutes

                        if (diffMinutes < 10) {
                            totalDiffMins=diffMinutes
                           
                            diffMinutes = `0${diffMinutes}`
                        }
                        
                        if(diffHours>9){
                            
                            
                            diffHours=diffHours-9
                            totalDiffHrs=diffHours
                            if(diffHours<10){
                                diffHours=`0${diffHours}`
                            }
                            detail.workingHour=`${diffHours}:${diffMinutes}`
                            detail.actualOtHrs=`${diffHours}:${diffMinutes}`

                            totalWorkingMinutes += totalDiffHrs * 60 + totalDiffMins;
                           
                        }

                    }

                }
                const totalHours = Math.floor(totalWorkingMinutes / 60);
                const totalMinutes = totalWorkingMinutes % 60;
                const totalWorkingHrs = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}`;

                e.totalActualOtHrs = totalWorkingHrs;

            })

            let empAttendanceApproved = await db.query(`
                       SELECT editOTday,date,type
                       FROM eve_acc_employee_overtime_approved
                       WHERE status='A'
                       AND employeeId=:employeeId
                       AND type IS NOT NULL
                       AND editOTday IS NOT NULL
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
                        x.approvedOtHrs = attendanceApprovedRecord.editOTday

                        const [otHours, otMinutes] = x.approvedOtHrs.split(':').map(Number);
                        totalApprovedOtMinutes += otHours * 60 + otMinutes;

                    }
                    else if (attendanceApprovedRecord.type === 'Reject') {
                        x.rejectOtHrs = attendanceApprovedRecord.editOTday
                        const [otHours, otMinutes] = x.rejectOtHrs.split(':').map(Number);
                        totalRejectOtMinutes += otHours * 60 + otMinutes;

                    }
                }

            })
            const totalOtHours = Math.floor(totalApprovedOtMinutes / 60);
            const totalOtMinutes = totalApprovedOtMinutes % 60;
            const totalApprovedOtHrs = `${String(totalOtHours).padStart(2, '0')}:${String(totalOtMinutes).padStart(2, '0')}`;
            e.totalApprovedOtHrs = totalApprovedOtHrs;

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
module.exports = { getOvertimeReport }


