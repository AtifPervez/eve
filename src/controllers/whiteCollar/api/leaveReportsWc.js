let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
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
const getLeaveReportsWc = async (req, res) => {
    try {

        const decodedToken = req.headerSession


        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let dbMain = sequelize()

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
        const tokenBranchUserId = sqlQuery[0]['employeeBranchId']


        let data = req.body
        let { year, month, empCode, empId, subCompId, branchId, departmentId, subDepartmentId, locationID, designationId, sortOrder } = data
        if (!year || !month) {
            return res.status(400).send({ status: false, msg: 'year and month are required' })
        }

        sortOrder = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

        let total = []
        let pending = []
        let totalApplied = []
        let totalApproved = []
        let totalRejected = []
        let totalClosingBalance = []

        let countQuery = await db.query(`
                                      SELECT COUNT(*) AS total
                                      FROM eve_acc_employee AS a
                           
                          
                            WHERE a.status='A'

                           AND (a.employeeType ='' OR a.employeeType IS NULL OR a.employeeType='White Collar')
                            -- AND employeeSubCompanyId=:tokenSubCompanyId
                            -- AND employeeBranchId=:tokenBranchUserId
                         
                            AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
                            AND (:id IS NULL OR a.id=:id)
                            AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId=:employeeSubCompanyId)
                            AND (:employeeBranchId IS NULL OR a.employeeBranchId=:employeeBranchId)
                            AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId=:employeeDepartmentId)
                            AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId=:employeeSubDepartmentId)
                            AND (:employeeDesignationId IS NULL OR a.employeeDesignationId=:employeeDesignationId)
                            AND (:locationID IS NULL OR a.locationID=:locationID)

                          	AND (
												a.employeeCurrentStatus  IS NULL
												OR (
                                                a.employeeCurrentStatus   != 'Inactive'
												AND a.employeeCurrentStatus   != 'termination'
												AND a.employeeCurrentStatus   != 'resignation'
												AND a.employeeCurrentStatus   != 'release')
											)

              

                            
                           

                         `,
            {
                replacements: {
                    employeeCode: empCode || null,
                    id: empId || null,
                    employeeSubCompanyId: subCompId || null,
                    employeeBranchId: branchId || null,
                    employeeDepartmentId: departmentId || null,
                    employeeSubDepartmentId: subDepartmentId || null,
                    employeeDesignationId: designationId || null,
                    locationID: locationID || null,
                    tokenUserId: tokenUserId,
                    tokenSubCompanyId: tokenSubCompanyId,
                    tokenBranchUserId: tokenBranchUserId,
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
                            a.id AS empId,
                            a.employeeName,
                            a.employeeCode,
                            a.employeeSubCompanyId,
                            a.employeeBranchId,
                            a.employeeDepartmentId,
                            a.employeeSubDepartmentId,
                            a.employeeDesignationId,
                            a.locationID,
                            a.employeeType,
                            a.employmentLeaveType
                           

                            FROM eve_acc_employee AS a
                          
                            CROSS JOIN (SELECT @row_number := :offset) AS init
                            WHERE a.status='A'

                           AND (a.employeeType ='' OR a.employeeType IS NULL OR a.employeeType='White Collar')
                            -- AND employeeSubCompanyId=:tokenSubCompanyId
                            -- AND employeeBranchId=:tokenBranchUserId
                         
                            AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
                            AND (:id IS NULL OR a.id=:id)
                            AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId=:employeeSubCompanyId)
                            AND (:employeeBranchId IS NULL OR a.employeeBranchId=:employeeBranchId)
                            AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId=:employeeDepartmentId)
                            AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId=:employeeSubDepartmentId)
                            AND (:employeeDesignationId IS NULL OR a.employeeDesignationId=:employeeDesignationId)
                            AND (:locationID IS NULL OR a.locationID=:locationID)

                          	AND (
												a.employeeCurrentStatus  IS NULL
												OR (
                                                a.employeeCurrentStatus   != 'Inactive'
												AND a.employeeCurrentStatus   != 'termination'
												AND a.employeeCurrentStatus   != 'resignation'
												AND a.employeeCurrentStatus   != 'release')
											)

                        


                            ORDER BY a.employeeName  ${sortOrder}
                            LIMIT :limit
                            OFFSET :offset
                            `,
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
                    employeeDesignationId: designationId || null,
                    locationID: locationID || null,
                    tokenUserId: tokenUserId,
                },
                type: QueryTypes.SELECT
            })

        let daysInCurrentMonth = myFunc.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)



        await Promise.all(getData.map(async e => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.locationName = await myFunc.getLocationNameById(e.locationID, db)

            const appDetailsObj = [];
            for (let i = 1; i <= NoOfdaysInMonth; i++) {

                let number = i.toString().padStart(2, '0');
                let empDtStrdate = new Date(`${year}-${month}-${number}`);
                let timestamp = Math.floor(empDtStrdate.getTime() / 1000);

                let newObj = {
                    crtDate: `${year}-${month}-${number}`,
                    attStatus: "--",
                    empDtStr: `${timestamp}`,
                    backcolor: "--",
                    title: "--",
                    type: '--',
                    remarks: '--',
                    leaveTypeId: '--',
                    leaveStatus: '--'
                };

                appDetailsObj.push(newObj);
            }
            e.appDetails = appDetailsObj

            let empAttendanceApproved = await db.query(`
             SELECT employeeId,date,type,remarks,leaveTypeId
             FROM eve_acc_employee_attendence_approved
             WHERE status='A'
             AND employeeId=:employeeId
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

            let leaveAprovedHistory = await db.query(`
                                    SELECT empId,leaveTypeId,fromDate,toDate,leaveStatus
                                    FROM  eve_acc_employee_leave_history
                                    WHERE status='A'
                                    AND empId=:empId
                                    AND YEAR(fromDate)=:year               
                                    AND YEAR(toDate)=:year
                                    AND MONTH(fromDate)=:month               
                                    AND MONTH(toDate)=:month `, {
                replacements: {
                    empId: e.empId,
                    year: year,
                    month: month
                },
                type: QueryTypes.SELECT
            })

            let attendanceMap = new Map()
            let leaveMap = new Map()
            let leaveMap1 = new Map()
            empAttendanceApproved.map(x => attendanceMap.set(x.date, x))
            leaveAprovedHistory.map(x => leaveMap.set(x.fromDate, x))
            leaveAprovedHistory.map(x => leaveMap1.set(x.toDate, x))

            await Promise.all(e.appDetails.map(async x => {

                if (attendanceMap.has(x.crtDate)) {
                    let leaveRecord = attendanceMap.get(x.crtDate)
                    x.type = leaveRecord.type
                    x.remarks = leaveRecord.remarks
                    x.leaveTypeId = leaveRecord.leaveTypeId

                    if (x.type == "full") {
                        x.title = "Present";
                        x.attStatus = "P"
                    }

                    else if (x.type == "reject" && x.remarks != "AB LEAVE" && x.remarks != "First Half" && x.remark != "Second Half") {
                        x.attStatus = "AB"

                        x.title = "Absent";

                    }
                    else if (x.type == "half") {
                        x.attStatus = "HD"

                        x.title = "Halfday";


                    }
                    else if (x.leaveTypeId && x.type == 'holiday' && x.remarks == 'L LEAVE' && x.leaveTypeId != null) {
                        let leaveResult = await myFunc.leaveType(x.leaveTypeId, db)
                        x.attStatus = leaveResult.prefix
                        x.title = leaveResult.name

                    }
                    else if (x.type == 'holiday' && x.remarks == 'L LEAVE' && x.leaveTypeId == '') {
                        x.attStatus = 'D-PL'
                        x.title = 'Default Paid Leave'
                    }
                    else if (x.type == 'reject' && x.remarks == 'AB LEAVE') {
                        x.attStatus = 'UL'
                        x.title = 'Unpaid Leave'
                    }
                    else if (x.type == 'holiday' && x.remarks == 'First Half' || x.remarks == 'Second Half') {
                        x.attStatus = 'HD-PL'
                        x.title = 'Halfday Paid Leave';
                    }
                    else if (x.type == 'reject' && x.remarks == 'First Half' || x.remarks == 'Second Half') {
                        x.attStatus = 'HD-UL'
                        x.title = 'Halfday unpaid Leave';
                    }
                    else if (x.type == 'holiday' && x.remarks != 'L LEAVE' && x.remarks != 'First Half' && x.remarks != 'Second Half') {
                        x.attStatus = 'MHD'
                        x.title = 'Marked as Holiday';
                    }
                    else if (x.type == "sunday reject") {
                        x.attStatus = "AB"
                        x.title = "Absent";
                    }
                    else {
                        x.attStatus = "--";
                        x.title = "--";
                    }

                }

                if (leaveMap.has(x.crtDate)) {
                    let leaveDetails = leaveMap.get(x.crtDate)
                    let leaveResult = await myFunc.leaveType(leaveDetails.leaveTypeId, db)

                    x.attStatus = leaveResult.prefix

                    x.title = leaveResult.name
                    x.leaveTypeId = leaveDetails.leaveTypeId
                    x.leaveStatus = leaveDetails.leaveStatus

                    if (leaveDetails.leaveStatus === 'C') {
                        x.backcolor = '#ffa7a5'
                    }
                    else if (leaveDetails.leaveStatus === 'W') {
                        x.backcolor = '#ADD8E6'
                    }
                    else if (leaveDetails.leaveStatus === 'A') {
                        x.backcolor = '#90EE90'
                    }

                }

                if (leaveMap1.has(x.crtDate)) {
                    let leaveDetails = leaveMap1.get(x.crtDate)
                    let leaveResult = await myFunc.leaveType(leaveDetails.leaveTypeId, db)

                    x.attStatus = leaveResult.prefix

                    x.title = leaveResult.name

                    x.leaveTypeId = leaveDetails.leaveTypeId
                    x.leaveStatus = leaveDetails.leaveStatus

                    if (leaveDetails.leaveStatus === 'C') {
                        x.backcolor = '#ffa7a5'
                    }
                    else if (leaveDetails.leaveStatus === 'W') {
                        x.backcolor = '#ADD8E6'
                    }
                    else if (leaveDetails.leaveStatus === 'A') {
                        x.backcolor = '#90EE90'
                    }
                }

            }))




            let leaveDb = await db.query(` SELECT 
                                           prefix, 
                                           colorCode 
                                           FROM eve_acc_leave_type WHERE status='A'`,
                {
                    type: QueryTypes.SELECT
                });


            let totalLeaveCounts = {};
            let pendingCounts = {};
            let appliedCount = {};
            let approvedCounts = {};
            let rejectCounts = {};
            let closingBalanceCount = {};

            leaveDb.forEach(x => {

                pendingCounts[x.prefix] = 0;
                approvedCounts[x.prefix] = 0;
                rejectCounts[x.prefix] = 0;
                appliedCount[x.prefix] = 0;
                closingBalanceCount[x.prefix] = 0;
            });

            e.appDetails.forEach(x => {
                if (totalLeaveCounts[x.attStatus] !== undefined) {
                    totalLeaveCounts[x.attStatus]++;
                }
                if (closingBalanceCount[x.attStatus] !== undefined) {
                    closingBalanceCount[x.attStatus]++;
                }

                if (pendingCounts[x.attStatus] !== undefined && x.leaveStatus === 'W') {
                    pendingCounts[x.attStatus]++;
                }

                if (approvedCounts[x.attStatus] !== undefined && x.leaveStatus === 'A') {
                    approvedCounts[x.attStatus]++;
                }

                if (rejectCounts[x.attStatus] !== undefined && x.leaveStatus === 'C') {
                    rejectCounts[x.attStatus]++;
                }
                if (appliedCount[x.attStatus] !== undefined && x.leaveStatus === 'A' || x.leaveStatus === 'C' || x.leaveStatus === 'W') {
                    appliedCount[x.attStatus]++;
                }
            });

            let leaveSetting = await db.query(`
                   SELECT a.subCompanyId,a.leaveTypeId,a.allocateLeaveDays,leaveTypeId AS prefix,b.forwardDays
                   FROM eve_acc_leave_setting AS a
                   LEFT JOIN eve_acc_leave_type AS b ON a.leaveTypeId=b.id 
                   WHERE a.status='A'
                   AND a.subCompanyId=:subCompanyId               
                   AND a.employmentLeaveTypeId=:employmentLeaveTypeId               
                             
                `, {
                replacements: {
                    subCompanyId: e.employeeSubCompanyId,
                    employmentLeaveTypeId: e.employmentLeaveType
                },
                type: QueryTypes.SELECT
            })

            const leaveMapData = new Map()

            await Promise.all(leaveSetting.map(async (x) => {
                x.prefix = await getleaveNameById(x.prefix, db);
                leaveMapData.set(x.prefix, parseFloat(x.allocateLeaveDays));
                // leaveMapData.set(x.prefix, parseFloat(x.forwardDays));
            }));
           
            e.total = leaveDb.map(leaveType => ({
                ...leaveType,
                total: leaveMapData.get(leaveType.prefix) || 0
            }));

            total = leaveDb.map(leaveType => ({
                ...leaveType,

            }));


            e.pending = leaveDb.map(leaveType => ({
                ...leaveType,
                total: pendingCounts[leaveType.prefix] || 0
            }));
            pending = leaveDb.map(leaveType => ({
                ...leaveType,

            }));

            e.totalApplied = leaveDb.map(leaveType => ({
                ...leaveType,
                total: appliedCount[leaveType.prefix] || 0
            }));
            totalApplied = leaveDb.map(leaveType => ({
                ...leaveType,

            }));


            e.totalApproved = leaveDb.map(leaveType => ({
                ...leaveType,
                total: approvedCounts[leaveType.prefix] || 0
            }));
            totalApproved = leaveDb.map(leaveType => ({
                ...leaveType,

            }));


            e.totalRejected = leaveDb.map(leaveType => ({
                ...leaveType,
                total: rejectCounts[leaveType.prefix] || 0
            }));

            totalRejected = leaveDb.map(leaveType => ({
                ...leaveType,

            }));

            e.totalClosingBalance = leaveDb.map(leaveType => ({
                ...leaveType,
                total: leaveMapData.get(leaveType.prefix) - approvedCounts[leaveType.prefix] || 0
            }

            ));

            totalClosingBalance = leaveDb.map(leaveType => ({
                ...leaveType,

            }));

        }))

        res.status(200).json({
            status: true,
            pageNo: pageNo,
            recordedPerPage: limit,
            totalData: totalData,
            total: total,
            pending: pending,
            totalApplied: totalApplied,
            totalApproved: totalApproved,
            totalRejected: totalRejected,
            totalClosingBalance: totalClosingBalance,
            employee: getData
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}


module.exports = { getLeaveReportsWc }