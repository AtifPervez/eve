const { QueryTypes } = require('sequelize')
const moment = require('moment')
const crypto = require('crypto');
const dayjs = require('dayjs');

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
    else {
        return ''
    }
}
const isMultiEmployee = async (id, db) => {
    let sql = await db.query(`
        SELECT multipleClockInClockOut FROM eve_acc_employee
            WHERE id=:id
            AND status='A'`, {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (sql[0]) {

        let res = Object.values(sql[0])
        let newRes = (res.toString());
        return newRes
    }
    else {
        return ''
    }
}

const getIncidentCategoryName = async (idString, db) => {
    // Validate input
    if (!idString || typeof idString !== 'string' || idString.trim() === '') {
        return '';
    }

    // Convert comma-separated string to array of trimmed IDs
    const ids = idString.split(',').map(x => x.trim()).filter(Boolean);

    if (ids.length === 0) {
        return '';
    }

    // Query category names
    const result = await db.query(
        `SELECT categoryName FROM eve_acc_incident_category_master 
     WHERE id IN (:ids)`,
        {
            replacements: { ids },
            type: QueryTypes.SELECT
        }
    );

    // Extract and join names
    const categoryNames = result.map(row => row.categoryName).join(', ');
    return categoryNames;
};
const getTemplateNameById = async (id, db) => {
    let templateName = await db.query('select templateName  from eve_blue_company_salary_components where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (templateName[0]) {

        let res = Object.values(templateName[0])
        let newRes = (res.toString());
        return newRes
    }
    else {
        return ''
    }
}
const getEmpMobNoByEmpId = async (id, db) => {
    let employeeMobile = await db.query('select employeeMobile  from eve_acc_employee where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (employeeMobile[0]) {

        let res = Object.values(employeeMobile[0])
        let newRes = (res.toString());
        return newRes
    }
    else {
        return ''
    }
}
const getEmpEmailByEmpId = async (id, db) => {
    let employeeEmail = await db.query('select employeeEmail  from eve_acc_employee where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (employeeEmail[0]) {

        let res = Object.values(employeeEmail[0])
        let newRes = (res.toString());
        return newRes
    }
    else {
        return ''
    }
}
const getShiftNameById = async (id, db) => {
    let shiftName = await db.query('select name  from eve_hrm_employee_shift_master where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (shiftName[0]) {

        let res = Object.values(shiftName[0])
        let newRes = (res.toString());
        return newRes
    }
    else {
        return ''
    }
}
const getDepartmentNameByDepartmentId = async (id, db) => {
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
    else {
        return ''
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
    else {
        return '--'
    }
}

function convertTimeToMinutes(time) {
    const [hour, minute] = time.split(':').map(Number);
    const totalMinutes = hour * 60 + minute;
    return totalMinutes;
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
        return newRes
    } else {
        return ''
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
    } else {
        return ''
    }
}
const getbranchStateName = async (id, db) => {
    let branchStateId = await db.query('select branchState  from eve_acc_company_branch where branchId=:branchId && status="A"', {
        replacements: {
            branchId: id,
        },
        type: QueryTypes.SELECT
    })

    if (branchStateId[0]) {

        const stateName = await db.query(`
            SELECT stateName FROM eve_accounts_state
            WHERE status='A' AND id=:branchState

            `, {
            replacements: {
                branchState: branchStateId[0].branchState

            }, type: QueryTypes.SELECT
        })

        let res = Object.values(stateName[0])
        let newRes = (res.toString())
        return newRes
    } else {
        return ''
    }
}
const getDesignationNameById = async (id, db) => {
    let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
    } else {
        return ''
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
    } else {
        return ''
    }
}



function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount).replace('₹', '').trim();
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
    else {
        return '--'
    }
}

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function decode(token) {

    for (let i = 0; i < 3; i++) {
        token = Buffer.from(token, 'base64').toString('utf-8');
    }
    return token
}
function encode(token) {
    for (let i = 0; i < 3; i++) {
        token = Buffer.from(token, 'base64').toString('utf-8');
    }
    return token
}

function convertMinutesToHHMM(minutes) {
    // Calculate hours and remaining minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    // Format hours and minutes with leading zeros
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(remainingMinutes).padStart(2, '0');

    // Combine hours and minutes in the "hh:mm" format
    const formattedTime = `${formattedHours}:${formattedMinutes}`;

    return formattedTime;
}

// function subtractTime(time1, time2) {
//     // Parse time strings into hour and minute components
//     const [hour1, minute1] = time1.split(':').map(Number);
//     const [hour2, minute2] = time2.split(':').map(Number);

//     // Convert hour and minute components into total minutes
//     const totalMinutes1 = hour1 * 60 + minute1;
//     const totalMinutes2 = hour2 * 60 + minute2;

//     // Subtract the total minutes of the second time from the first time
//     let diffMinutes = totalMinutes1 - totalMinutes2;

//     // if (diffMinutes < 0) {
//     //     // If the result is negative, assume we are crossing midnight and add 24 hours worth of minutes
//     //     diffMinutes += 24 * 60;
//     // }

//     // Convert the result back to the "hh:mm" format
//     const diffHours = Math.floor(diffMinutes / 60);
//     const diffMins = diffMinutes % 60;

//     // Add leading zeros for single-digit hours/minutes
//     const formattedDiff = `${String(diffHours).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
//     return formattedDiff;
// }
function subtractTime(time1, time2) {
    if (!time1 || !time2 || typeof time1 !== 'string' || typeof time2 !== 'string') {
        return '00:00'; // or throw an error, or return null — depending on your logic
    }

    const [hour1, minute1] = time1.split(':').map(Number);
    const [hour2, minute2] = time2.split(':').map(Number);

    const totalMinutes1 = hour1 * 60 + minute1;
    const totalMinutes2 = hour2 * 60 + minute2;

    let diffMinutes = totalMinutes2 - totalMinutes1;
    if (diffMinutes < 0) diffMinutes += 24 * 60;

    const diffHours = Math.floor(diffMinutes / 60);
    const diffMins = diffMinutes % 60;

    return `${String(diffHours).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}`;
}

function convertDateDDMMYYYY(date) {
    let parsedDate = moment(date)
    let newDate = parsedDate.format('DD-MM-YYYY')
    return newDate
}


const getAssetCategoryName = async (id, db) => {
    let categoryName = await db.query('select assetName from eve_hrm_employee_set_asset_category where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (categoryName[0]) {
        let res = Object.values(categoryName[0])
        let newRes = res.toString()
        return newRes
    } else {
        return ''
    }
}
const getAssetName = async (id, db) => {
    let assetName = await db.query('select assetName from eve_hrm_employee_set_asset_details where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (assetName[0]) {
        let res = Object.values(assetName[0])
        let newRes = res.toString()
        return newRes
    } else {
        return ''
    }
}
function statusColor(status) {
    if (status == 'pending') {
        return 'yellow'
    }
    else if (status == 'approved') {
        return 'green'
    }
    else if (status == 'rejected') {
        return 'red'
    }
    else {
        return ''
    }
}

function reorderObjectProperties(obj) {
    const slNo = obj['Sl. No.'];
    delete obj['Sl. No.'];
    const reorderedObj = { 'Sl. No.': slNo, ...obj };
    return reorderedObj;
}





function arrangeKeys(arr) {

    const maxKeysObj = arr.reduce((max, obj) => Object.keys(obj).length > Object.keys(max).length ? obj : max, {});


    const keysInOrder = Object.keys(maxKeysObj);


    function addMissingKeys(obj) {
        const newObj = {};
        keysInOrder.forEach(key => {
            newObj[key] = obj.hasOwnProperty(key) ? obj[key] : '--';
        });
        return newObj;
    }


    return arr.map(obj => addMissingKeys(obj));
}

function convertMonthName(monthNumber) {
    const months = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
    ];

    // Subtracting 1 from monthNumber since JavaScript months are zero-based (0 for January, 11 for December)
    const monthIndex = parseInt(monthNumber) - 1;

    if (monthIndex >= 0 && monthIndex < 12) {
        return months[monthIndex];
    } else {
        return "Invalid month";
    }
}
const getEmpCodeFromEmpId = async (id, db) => {
    let empCode = await db.query('select employeeCode from eve_acc_employee where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (empCode[0]) {
        let res = Object.values(empCode[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getDesignationIdFromEmpId = async (id, db) => {
    let designationName = await db.query('select employeeDesignationId  from eve_acc_employee where id=:id && status="A"', {
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
    else {
        return ''
    }
}
const taggedResponsiblePerson = async (id, db) => {
    let person = await db.query('select taggedResponsible from eve_hrm_employee_set_asset_category where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (person[0]) {
        let res = Object.values(person[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }

}

function replaceEmptyValues(employees) {
    return employees.map(employee => {
        return Object.fromEntries(
            Object.entries(employee).map(([key, value]) => [key, value === '' || value === null ? '--' : value])
        );
    });
}
function replaceEmptyValuesApi(employees) {
    return employees.map(employee => {
        return Object.fromEntries(
            Object.entries(employee).map(([key, value]) => [key, value === '' || value === null ? '' : value])
        );
    });
}
const getLocationNameById = async (id, db) => {

    let locationName = await db.query(`
                                         SELECT location
                                         FROM eve_acc_locationmaster
                                         WHERE status='A'
                                         AND id=:id
                                         `,
        {
            replacements: {
                id: id,
            },
            type: QueryTypes.SELECT
        })
    if (locationName[0]) {
        let res = Object.values(locationName[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
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
        return empleaveType[0]
    }
    else {
        return ''
    }
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


const getEmpTypeName = async (id, db) => {
    let typeName = await db.query(`
        SELECT typeName 
        FROM eve_hrm_employee_type_master
        WHERE id=:id
        AND status='A'
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (typeName[0]) {
        let res = Object.values(typeName[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getWorkTypeName = async (id, db) => {
    let typeName = await db.query(`
        SELECT workerTypeName 
        FROM eve_employee_worker_type
        WHERE id=:id
        AND status='A'
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (typeName[0]) {
        let res = Object.values(typeName[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getReferenceNameById = async (id, db) => {
    let source = await db.query(`
        SELECT source 
        FROM eve_hrm_candidate_source
        WHERE id=:id
        AND status='A'
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (source[0]) {
        let res = Object.values(source[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getEmpEducationDegree = async (id, db) => {
    let degreeName = await db.query(`
        SELECT degreeName 
        FROM eve_hrm_educations_degree
        WHERE id=:id
        AND status='A'
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (degreeName[0]) {
        let res = Object.values(degreeName[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getEmpNationality = async (id, db) => {
    let countryName = await db.query(`
        SELECT countryName 
        FROM eve_accounts_country
        WHERE id=:id
        AND status='A'
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (countryName[0]) {
        let res = Object.values(countryName[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getDocumentNameById = async (id, db) => {
    let documentName = await db.query(`
        SELECT documentName 
        FROM eve_hrm_upload_document_master
        WHERE id=:id
        AND status='A'
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (documentName[0]) {
        let res = Object.values(documentName[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getInterviewStatus = async (id, db) => {
    let name = await db.query(`
        SELECT name 
        FROM eve_hrm_candidate_interview_process_type
        WHERE id=:id
        AND status='A'
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (name[0]) {
        let res = Object.values(name[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getCheckListCategoryNameById = async (id, db) => {
    let name = await db.query(`
        SELECT checkListName 
        FROM eve_checklist_category
        WHERE id=:id
        
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (name[0]) {
        let res = Object.values(name[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}
const getCheckListNameById = async (id, db) => {
    let name = await db.query(`
        SELECT checkListName 
        FROM eve_checklist_module
        WHERE id=:id
        
        `, {
        replacements: {
            id: id
        },
        type: QueryTypes.SELECT
    })
    if (name[0]) {
        let res = Object.values(name[0])
        let newRes = res.toString()
        return newRes
    }
    else {
        return ''
    }
}

function openSSLDecryption(encryptedText) {
    const algorithm = 'AES-256-CBC';
    const key = 'LmLWPyqOa1b3nqvOhUdlXoJoKjgZkIjii2eNya6DMbuXRLE3rgXO28q7GLAGfkRZ'.slice(0, 32); // Ensure the key is 32 bytes
    const iv = 'ABCDEFGH91011121'; // Ensure the IV is 16 bytes
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function addTimes(times) {
    let totalMinutes = 0;

    times.forEach(time => {
        if (!time || !time.includes(":")) return; // Safely skip invalid entries

        const [hoursStr, minutesStr] = time.split(":");
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        // Only add if hours/minutes are valid numbers
        if (!isNaN(hours) && !isNaN(minutes)) {
            totalMinutes += hours * 60 + minutes;
        }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
const formatTime = (input) => {
    if (!input) {
        // console.warn('Input is undefined or invalid:', input);
        return '00:00'; // Default value for invalid input
    }

    if (typeof input === 'string' && input.includes(':')) {
        return input;
    }

    let hours = String(input).padStart(2, '0');
    return `${hours}:00`;
}

const extractText = (htmlString) => {
    // Create a DOMParser instance
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(htmlString);
    const document = dom.window.document;

    // First, check for <p> tags
    const pTags = document.querySelectorAll('p');
    if (pTags.length > 0) {
        return Array.from(pTags).map(tag => tag.textContent.trim()).join(' ');
    }

    // If no <p> tags, check for <li> tags with 'ng-binding' class
    const liTags = document.querySelectorAll('li.ng-binding');
    if (liTags.length > 0) {
        return Array.from(liTags).map(tag => tag.textContent.trim()).join(' ');
    }

    // Default return if no matches are found
    return '';
};

function validateTime(timeStr) {
    // Split the time string by colon
    const parts = timeStr.split(':');

    // Handle negative values
    if (parts[0].startsWith('-')) {
        // If the first part is negative, it should be converted to 00:00
        return '00:00';
    }

    // Validate the format (HH:MM)
    if (parts.length !== 2 ||
        isNaN(parts[0]) ||
        isNaN(parts[1]) ||
        parts[0] < 0 || parts[0] > 23 ||
        parts[1] < 0 || parts[1] > 59) {
        return 'Invalid time format';
    }

    // If valid, return the original time string
    return timeStr;
}

const getEmployeeWiseOfficeSchedule = async (empId, date = "", db) => {
    let shiftList = await db.query(`
        SELECT * FROM eve_hrm_employee_roaster
        WHERE status = 'A' AND employeeId = :empId 
        AND fromDate <= :date AND toDate >= :date
    `, {
        replacements: { empId, date },
        type: QueryTypes.SELECT
    });




    if (shiftList[0]) {

        let shiftDetails = await db.query(`
            SELECT * FROM eve_hrm_employee_shift_master
            WHERE id = :shiftId AND status = 'A'
            `, {
            replacements: { shiftId: shiftList[0].shiftId },
            type: QueryTypes.SELECT
        });

        if (shiftDetails[0]) {
            return (shiftDetails[0])
        }
    }
    else {

        let customShift = await db.query(`
                SELECT * FROM eve_hrm_employee_shift_customize
                WHERE status = 'A' AND employeeId = :empId
                ORDER BY id DESC
                `, {
            replacements: { empId },
            type: QueryTypes.SELECT
        });


        if (customShift[0]) {
            return (customShift[0])
        }

        else {

            let employee = await db.query(`
                        SELECT * FROM eve_hrm_employee_details
                        WHERE status = 'A' AND employeeId = :empId
                        
                        `, {
                replacements: { empId },
                type: QueryTypes.SELECT
            });
            if (employee[0]) {
                let shift = await db.query(`
                                SELECT * FROM eve_hrm_employee_shift_master
                                WHERE id = :shiftId AND status = 'A'
                                `, {
                    replacements: { shiftId: employee[0].shiftId },
                    type: QueryTypes.SELECT
                });

                if (shift[0]) {
                    return (shift[0])
                }
            }
        }

    }
}
// const getEmployeeWiseOfficeSchedule = async (empId, date = "", db) => {
//   const [result] = await db.query(`
//     SELECT 
//       COALESCE(sm.lateTimeEnd, csm.lateTimeEnd, sm2.lateTimeEnd) AS lateTimeEnd
//     FROM eve_hrm_employee_details ed
//     LEFT JOIN eve_hrm_employee_roaster r 
//       ON r.employeeId = ed.employeeId AND r.status = 'A' AND r.fromDate <= :date AND r.toDate >= :date
//     LEFT JOIN eve_hrm_employee_shift_master sm 
//       ON sm.id = r.shiftId AND sm.status = 'A'
//     LEFT JOIN (
//       SELECT * FROM eve_hrm_employee_shift_customize 
//       WHERE status = 'A' AND employeeId = :empId 
//       ORDER BY id DESC LIMIT 1
//     ) csm ON csm.employeeId = ed.employeeId
//     LEFT JOIN eve_hrm_employee_shift_master sm2 
//       ON sm2.id = ed.shiftId AND sm2.status = 'A'
//     WHERE ed.status = 'A' AND ed.employeeId = :empId
//     LIMIT 1
//   `, {
//     replacements: { empId, date },
//     type: QueryTypes.SELECT
//   });

//   return result?.lateTimeEnd || null;
// };
const getCompanyLateTimeEnd = async (db, tokenCompanyId) => {
    const [company] = await db.query(`
    SELECT lateTimeEnd FROM eve_main_company
    WHERE status = 'A' AND id = :id
    LIMIT 1
  `, {
        replacements: { id: tokenCompanyId },
        type: QueryTypes.SELECT
    });
    return company?.lateTimeEnd || null;
};

const getShiftName = async (empId, date = "", db) => {
    let shiftList = await db.query(`
        SELECT * FROM eve_hrm_employee_roaster
        WHERE status = 'A' AND employeeId = :empId 
        AND fromDate <= :date AND toDate >= :date
    `, {
        replacements: { empId, date },
        type: QueryTypes.SELECT
    });



    if (shiftList[0]) {

        if (shiftList[0].shiftId == 0) {
            return "Off Day"
        }
        else {

            let shiftDetails = await db.query(`
                SELECT * FROM eve_hrm_employee_shift_master
                WHERE id = :shiftId AND status = 'A'
                `, {
                replacements: { shiftId: shiftList[0].shiftId },
                type: QueryTypes.SELECT
            });

            if (shiftDetails[0]) {
                return (shiftDetails[0]['name'])
            }
        }

    }
    else {

        let customShift = await db.query(`
                SELECT * FROM eve_hrm_employee_shift_customize
                WHERE status = 'A' AND employeeId = :empId
                ORDER BY id DESC
                `, {
            replacements: { empId },
            type: QueryTypes.SELECT
        });

        if (customShift[0]) {
            return (customShift[0]['name'])
        }

        else {

            let employee = await db.query(`
                        SELECT * FROM eve_hrm_employee_details
                        WHERE status = 'A' AND employeeId = :empId
                        
                        `, {
                replacements: { empId },
                type: QueryTypes.SELECT
            });
            if (employee[0]) {
                let shift = await db.query(`
                                SELECT * FROM eve_hrm_employee_shift_master
                                WHERE id = :shiftId AND status = 'A'
                                `, {
                    replacements: { shiftId: employee[0].shiftId },
                    type: QueryTypes.SELECT
                });


                if (shift[0]) {
                    return (shift[0]['name'])
                }
            }
        }

    }
}


const getEmployeeWiseOfficeScheduleBc = async (empId, date = "", db) => {
    let shiftList = await db.query(`
        SELECT * FROM eve_hrm_employee_roaster
        WHERE status = 'A' AND employeeId = :empId 
        AND fromDate <= :date AND toDate >= :date
    `, {
        replacements: { empId, date },
        type: QueryTypes.SELECT
    });





    if (shiftList[0]) {


        let shiftDetails = await db.query(`
            SELECT * FROM eve_hrm_employee_shift_master
            WHERE id = :shiftId AND status = 'A'
            `, {
            replacements: { shiftId: shiftList[0].shiftId },
            type: QueryTypes.SELECT
        });


        if (shiftDetails[0]) {
            return (shiftDetails[0]['maxGraceClockInTime'])
        }
    }
    else {

        let customShift = await db.query(`
                SELECT * FROM eve_hrm_employee_shift_customize
                WHERE status = 'A' AND employeeId = :empId
                ORDER BY id DESC
                `, {
            replacements: { empId },
            type: QueryTypes.SELECT
        });

        if (customShift[0]) {
            return (customShift[0]['maxGraceClockInTime'])
        }

        else {

            let employee = await db.query(`
                        SELECT * FROM eve_hrm_employee_details
                        WHERE status = 'A' AND employeeId = :empId
                        
                        `, {
                replacements: { empId },
                type: QueryTypes.SELECT
            });
            if (employee[0]) {
                let shift = await db.query(`
                                SELECT * FROM eve_hrm_employee_shift_master
                                WHERE id = :shiftId AND status = 'A'
                                `, {
                    replacements: { shiftId: employee[0].shiftId },
                    type: QueryTypes.SELECT
                });


                if (shift[0]) {
                    return (shift[0]['maxGraceClockInTime'])
                }
            }
        }

    }


};


const getEmployeeWiseOfficeScheduleWages = async (empId, date = "", db) => {
    let shiftList = await db.query(`
        SELECT shiftId FROM eve_hrm_employee_roaster
        WHERE status = 'A' AND employeeId = :empId 
        AND fromDate <= :date AND toDate >= :date
    `, {
        replacements: { empId, date },
        type: QueryTypes.SELECT
    });

    // if (shiftList[0] && shiftList[0]['shiftId']!=0) {
    if (shiftList[0]) {


        let shiftDetails = await db.query(`
            SELECT clockInTime,clockOutTime FROM eve_hrm_employee_shift_master
            WHERE id = :shiftId AND status = 'A'
            `, {
            replacements: { shiftId: shiftList[0].shiftId },
            type: QueryTypes.SELECT
        });

        if (shiftDetails[0]) {
            return (shiftDetails[0])
        }
    }


    else {

        let employee = await db.query(`
                        SELECT shiftId FROM eve_hrm_employee_details
                        WHERE status = 'A' AND employeeId = :empId
                        
                        `, {
            replacements: { empId },
            type: QueryTypes.SELECT
        });

        if (employee[0]) {
            let shift = await db.query(`
                    SELECT clockInTime,clockOutTime FROM eve_hrm_employee_shift_master
                    WHERE id = :shiftId AND status = 'A'
                `, {
                replacements: { shiftId: employee[0].shiftId },
                type: QueryTypes.SELECT
            });

            if (shift[0]) {
                return (shift[0])
            }
        }
    }

}


// };




const formatDateCombine = (dateString) => {
    let date = new Date(dateString);
    let formattedDate = date.getFullYear().toString() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2);
    return formattedDate;
};
// Function to calculate working hours
function calculateWorkingHours(intime, outTime) {
    if (intime !== '--' && outTime !== '--') {

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
    else {
        return '--'
    }
}

function getDaysPassedInMonth(yearStr, monthStr) {
    const inputYear = parseInt(yearStr, 10);
    const inputMonth = parseInt(monthStr, 10) - 1; // 0-based for moment
    const today = moment();
    const inputDate = moment({ year: inputYear, month: inputMonth });

    if (inputDate.isSame(today, 'month') && inputDate.isSame(today, 'year')) {
        return today.date(); // Days passed so far this month
    } else if (inputDate.isBefore(today, 'month') || inputDate.isBefore(today, 'year')) {
        return inputDate.daysInMonth(); // Total days in that past month
    } else {
        return 0; // Future month
    }
}
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

async function getExtraDutyAmountByEmployeeId(employeeId, month, year, salaryTemplateId, db) {

    let totalDaysInMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
    let startDate = moment(`${year}-${month}-01`).format('YYYY-MM-DD');
    let endDate = moment(`${year}-${month}-${totalDaysInMonth}`).format('YYYY-MM-DD');

    let compOffAmount = 0;
    let extraDutyOffPaidAct = await moduleActivation('extra_duty_off_paid', db);

    if (extraDutyOffPaidAct === 'yes') {
        const extraDutyModel = await db.query(`
              SELECT * FROM eve_acc_extra_duty_encashment_calculation_setting
              WHERE status = 'A' AND salaryTemplateId = :salaryTemplateId
          `, {
            replacements: { salaryTemplateId },
            type: QueryTypes.SELECT
        });

        let totalComponentWiseAmount = 0;

        if (extraDutyModel.length > 0) {
            let salaryComponentArr = extraDutyModel[0].salaryComponents.split(',');

            await Promise.all(
                salaryComponentArr.map(async (e) => {
                    const salaryEmpWiseModel = await db.query(`
                          SELECT salaryAmount FROM eve_acc_set_monthly_salary_employee_wise
                          WHERE status = 'A' AND salaryTempId = :salaryTempId
                            AND employeeId = :employeeId AND salaryId = :salaryId
                      `, {
                        replacements: {
                            salaryTempId: salaryTemplateId,
                            employeeId,
                            salaryId: e
                        },
                        type: QueryTypes.SELECT
                    });

                    if (salaryEmpWiseModel.length > 0) {
                        let salaryAmount = salaryEmpWiseModel[0].salaryAmount;
                        if (salaryAmount != null && salaryAmount !== '') {
                            totalComponentWiseAmount += parseFloat(salaryAmount);
                        }
                    }
                })
            );

            let dailyComponentWiseAmount = totalComponentWiseAmount / totalDaysInMonth;

            const extraDutyOffPaidModel = await db.query(`
                  SELECT SUM(countDays) AS totalCompOffDays
                  FROM eve_acc_employee_extra_duty_alocation
                  WHERE status = 'A' AND empId = :empId
                    AND workDate >= :startDate AND workDate <= :endDate
              `, {
                replacements: {
                    empId: employeeId,
                    startDate,
                    endDate
                },
                type: QueryTypes.SELECT
            });

            let totalCompOffDays = parseFloat(extraDutyOffPaidModel[0].totalCompOffDays || 0);

            const extraDutyMasterModel = await db.query(`
                  SELECT * FROM eve_acc_extra_duty_master_setting
                  WHERE status = 'A'
                  ORDER BY id DESC
              `, {
                type: QueryTypes.SELECT
            });

            let maxCompOffPaidDays = parseFloat(extraDutyMasterModel[0].maxCompOffPaidDays || 0);
            let daysPaidForPerDayCompOff = parseFloat(extraDutyMasterModel[0].daysPaidForPerDayCompOff || '1');

            totalCompOffDays = Math.min(totalCompOffDays, maxCompOffPaidDays);

            compOffAmount = Math.round(totalCompOffDays * daysPaidForPerDayCompOff * dailyComponentWiseAmount);
        }
    }

    return compOffAmount;
}
function isValidWorkingHour(value) {
    // Regex: matches 00:00 to 23:59
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(value);
}

async function getOvertimeAmountByEmployeeId(employeeId, month, year, tempId, db) {

    const totalDaysInMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
    const startDate = moment(`${year}-${month}-01`).format('YYYY-MM-DD');
    const endDate = moment(`${year}-${month}-${totalDaysInMonth}`).format('YYYY-MM-DD');

    let overtimeTotalAmount = 0;
    let getTotalHours = 0;
    let getTotalHours2 = 0;
    let getTotalMinutes2 = 0;
    let getTotalMinutes = 0;
    let totalApprovehour = 0;
    let totalApprovehour1 = 0;
    let totalApprovehour2 = 0;
    let amount = 0;
    let overTime_InMinute = 0;
    let overTime_InMinute1 = 0;
    let shiftHours = 0;
    let minWorkHrs = 0;
    let minWorkHrsMin = 0;
    let totalhrs = 0;
    let totalmin = 0;
    let clockIn = '00:00'
    let clockOut = '00:00'
    let noOfTimes

    const sqlEmpDetails = await db.query(
        `
                              SELECT id FROM eve_acc_employee
                              WHERE status='A'
                              AND isOvertimeApplicable='yes'
                              AND id=:id

        `, {
        replacements: {
            id: employeeId

        }, type: QueryTypes.SELECT
    }
    )
    
    
    if (sqlEmpDetails.length > 0) {
        
        const sqlAttnApp = await db.query(
            `
            SELECT * FROM eve_acc_employee_overtime_approved
            where employeeId=:employeeId
            and status='A'
            and type='Approve'
            and date >= :startDate
            and date <= :endDate
            
            `, {
                replacements: {
                    
                    employeeId: employeeId,
                    startDate: startDate,
                    endDate: endDate,
                    
                }, type: QueryTypes.SELECT
            }
        )
        
        
        
        
        
        if (sqlAttnApp.length > 0) {
            
            await Promise.all(sqlAttnApp.map(async (x) => {
                
                if (x.editOTday != '' && x.editOTday != null) {
                    getTotalHours += parseInt(x.editOTday.split(':')[0])
                    getTotalMinutes += parseInt(x.editOTday.split(':')[1])
                    totalApprovehour1 = getTotalHours * 60 + getTotalMinutes
                }
                else {
                    if (x.workingHour && isValidWorkingHour(x.workingHour)) {
                        getTotalHours += parseInt(x.workingHour.split(':')[0])
                        getTotalMinutes += parseInt(x.workingHour.split(':')[1])
                    }
                    totalApprovehour1 = getTotalHours * 60 + getTotalMinutes
                }
                
            }))
            
            const sqlEmpList = await db.query(
                
                `
                SELECT attendanceType,shiftId 
                FROM eve_hrm_employee_details
                WHERE status='A'
                AND employeeId=:employeeId
                AND attendanceType IS NOT NULL
                
                `, {
                    replacements: {
                        employeeId: employeeId,
                        
                    }, type: QueryTypes.SELECT
                }
            )
            if (sqlEmpList.length > 0) {
                if (sqlEmpList[0]['attendanceType'] === 'shift_wise') {
                    const sqlShift = await db.query(
                        `
                        SELECT * FROM eve_hrm_employee_shift_master
                        WHERE id=:id
                        AND status='A'
                        
                        `, {
                            replacements: {
                                id: sqlEmpList[0]['shiftId']
                            }, type: QueryTypes.SELECT
                        }
                    )
                    
                    clockIn = sqlShift[0]['clockInTime']
                    clockOut = sqlShift[0]['clockOutTime']
                    
                    
                }
                // }
                else if (sqlEmpList[0]['attendanceType'] === 'customize') {
                    const sqlShiftCustomise = await db.query(
                        `
                        SELECT * FROM 
                        eve_hrm_employee_shift_customize
                        WHERE status='A'
                        AND employeeId=:employeeId
                        `, {
                            replacements: {
                                employeeId: employeeId
                            }, type: QueryTypes.SELECT
                        }
                    )
                    
                    clockIn = sqlShiftCustomise[0]['clockInTime']
                    clockOut = sqlShiftCustomise[0]['clockOutTime']
                    
                }
                
                else if (sqlEmpList[0]['attendanceType'] === 'roaster') {
                    const sqlRoasater = await db.query(
                        `
                        SELECT * FROM 
                        eve_hrm_employee_roaster
                        WHERE status='A'
                        AND employeeId=:employeeId
                        `, {
                            replacements: {
                                employeeId: employeeId
                            }, type: QueryTypes.SELECT
                        }
                    )
                    
                    await Promise.all(sqlRoasater.map(async e => {
                        const sqlShiftDetails = await db.query(
                            `
                            select * from eve_hrm_employee_shift_master
                            where id=:id
                            and status='A'
                            `, {
                                replacements: {
                                    id: e.shiftId
                                }, type: QueryTypes.SELECT
                            }
                        )
                        clockIn = sqlShiftDetails[0]['clockInTime'];
                        
                        clockOut = sqlShiftDetails[0]['clockOutTime'];
                        
                    }))
                    
                }
            }
            
            
            const overtimeSql = await db.query(
                `
                select * from eve_overtime_rate_settings
                where status='A'
                and salaryComponent is not null
                and tempId=:tempId
                
                `, {
                    replacements: {
                        tempId: tempId
                        
                    }, type: QueryTypes.SELECT
                }
            )
            
            
            if (overtimeSql.length > 0) {
                
                await Promise.all(overtimeSql.map(async e => {
                    let templateId = e.tempId
                    noOfTimes = e.noOfTimes !== null ? parseFloat(e.noOfTimes) : 1
                    let salaryComponent = (e.salaryComponent).split(',')
                    
                    await Promise.all(salaryComponent.map(async x => {
                        const overtimeSql2 = await db.query(
                            `
                            select * from eve_acc_set_monthly_salary_employee_wise
                            where status='A'
                            and salaryTempId=:salaryTempId
                            and salaryId=:salaryId
                            and employeeId=:employeeId
                            `, {
                                replacements: {
                                    salaryTempId: templateId,
                                    salaryId: x,
                                    employeeId: employeeId,
                            }, type: QueryTypes.SELECT
                        }
                        )
                        
                        
                        // if(overtimeSql2.length>0){
                            
                        //     if(overtimeSql2[0].salaryTempId===templateId){
                            //         noOfTimes=overtimeSql[0].noOfTimes
                            
                            // }
                            // }
                            
                            
                            if (overtimeSql2.length > 0) {
                                await Promise.all(overtimeSql2.map(async z => {
                                    amount += parseFloat(z.salaryAmount)
                                    
                                }))
                            }
                        }))
                    }))
                }
                
              
                let soutHrs = parseInt(clockOut.split(':')[0])
                let soutmin = parseInt(clockOut.split(':')[1])
                let sinhrs = parseInt(clockIn.split(':')[0])
                let sinmin = parseInt(clockIn.split(':')[1])
                // console.log(soutHrs,soutmin,sinhrs,sinmin);
                
            let cheoutTotalMin = soutHrs * 60 + soutmin
            let cheinTotalMin = sinhrs * 60 + sinmin

            let shiftTotalMin = cheoutTotalMin - cheinTotalMin
            shiftHours = shiftTotalMin / 60;


            let totalApproveHourApp = hoursAndMins(totalApprovehour1)
            // console.log(shiftHours,totalApproveHourApp);


            let hrsApp = totalApproveHourApp.split(':')

            let appHrs = hrsApp[0]
            let appMin = hrsApp[1]
            if (appMin > 30) {
                totalApprovehour = parseInt(appHrs + 1)
            }
            else {
                totalApprovehour = parseInt(appHrs)
            }




            overtimeTotalAmount = ((amount / totalDaysInMonth / shiftHours * noOfTimes) * totalApprovehour)


        }
        else {
            overtimeTotalAmount = 0
        }

    }
    else {
        overtimeTotalAmount = 0
    }
    return overtimeTotalAmount

}
function convertToHours(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
}
async function getWagesOtAmntByEmpIdDayWise(employeeId, month, year, tempId, overtimeHrs, db) {

    const totalDaysInMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
    const startDate = moment(`${year}-${month}-01`).format('YYYY-MM-DD');
    const endDate = moment(`${year}-${month}-${totalDaysInMonth}`).format('YYYY-MM-DD');

    let overtimeTotalAmount = 0;
    let getTotalHours = 0;
    let getTotalHours2 = 0;
    let getTotalMinutes2 = 0;
    let getTotalMinutes = 0;
    let totalApprovehour = 0;
    let totalApprovehour1 = 0;
    let totalApprovehour2 = 0;
    let amount = 0;
    let overTime_InMinute = 0;
    let overTime_InMinute1 = 0;
    let shiftHours = 0;
    let minWorkHrs = 0;
    let minWorkHrsMin = 0;
    let totalhrs = 0;
    let totalmin = 0;
    let clockIn = 0;
    let clockOut = 0;
    let noOfTimes

    const sqlEmpDetails = await db.query(
        `
                              SELECT id FROM eve_acc_employee
                              WHERE status='A'
                              AND isOvertimeApplicable='yes'
                              AND id=:id

        `, {
        replacements: {
            id: employeeId

        }, type: QueryTypes.SELECT
    }
    )


    if (sqlEmpDetails.length > 0) {

        const sqlAttnApp = await db.query(
            `
            SELECT * FROM eve_acc_employee_overtime_approved
            where employeeId=:employeeId
            and status='A'
            and type='Approve'
            and date >= :startDate
            and date <= :endDate
            
            `, {
            replacements: {

                employeeId: employeeId,
                startDate: startDate,
                endDate: endDate,

            }, type: QueryTypes.SELECT
        }
        )



        if (sqlAttnApp.length > 0) {

            await Promise.all(sqlAttnApp.map(async (x) => {

                if (x.editOTday != '' && x.editOTday != null) {
                    getTotalHours += parseInt(x.editOTday.split(':')[0])
                    getTotalMinutes += parseInt(x.editOTday.split(':')[1])
                    totalApprovehour1 = getTotalHours * 60 + getTotalMinutes
                }
                else if (x.workingHour != '' && x.workingHour != null) {
                    getTotalHours += parseInt(x.workingHour.split(':')[0])
                    getTotalMinutes += parseInt(x.workingHour.split(':')[1])
                    totalApprovehour1 = getTotalHours * 60 + getTotalMinutes
                }

            }))


            const sqlEmpList = await db.query(

                `
                SELECT attendanceType,shiftId 
                FROM eve_hrm_employee_details
                WHERE status='A'
                AND employeeId=:employeeId
                AND attendanceType IS NOT NULL
                
                `, {
                replacements: {
                    employeeId: employeeId,

                }, type: QueryTypes.SELECT
            }
            )
            if (sqlEmpList.length > 0) {
                if (sqlEmpList[0]['attendanceType'] == 'shift_wise') {
                    const sqlShift = await db.query(
                        `
                        SELECT * FROM eve_hrm_employee_shift_master
                        WHERE id=:id
                        AND status='A'
                        
                        `, {
                        replacements: {
                            id: sqlEmpList[0]['shiftId']
                        }, type: QueryTypes.SELECT
                    }
                    )

                    clockIn = sqlShift[0]['clockInTime']
                    clockOut = sqlShift[0]['clockOutTime']


                }
                // }
                else if (sqlEmpList[0]['attendanceType'] == 'customize') {
                    const sqlShiftCustomise = await db.query(
                        `
                        SELECT * FROM 
                        eve_hrm_employee_shift_customize
                        WHERE status='A'
                        AND employeeId=:employeeId
                        `, {
                        replacements: {
                            employeeId: employeeId
                        }, type: QueryTypes.SELECT
                    }
                    )

                    clockIn = sqlShiftCustomise[0]['clockInTime']
                    clockOut = sqlShiftCustomise[0]['clockOutTime']

                }

                else if (sqlEmpList[0]['attendanceType'] == 'roaster') {
                    const sqlRoasater = await db.query(
                        `
                        SELECT * FROM 
                        eve_hrm_employee_roaster
                        WHERE status='A'
                    AND employeeId=:employeeId
                    `, {
                        replacements: {
                            employeeId: employeeId
                        }, type: QueryTypes.SELECT
                    }
                    )

                    await Promise.all(sqlRoasater.map(async e => {
                        const sqlShiftDetails = await db.query(
                            `
                            select * from eve_hrm_employee_shift_master
                            where id=:id
                            and status='A'
                            `, {
                            replacements: {
                                id: e.shiftId
                            }, type: QueryTypes.SELECT
                        }
                        )
                        clockIn = sqlShiftDetails[0]['clockInTime'];

                        clockOut = sqlShiftDetails[0]['clockOutTime'];

                    }))

                }
            }


            const overtimeSql = await db.query(
                `
                select * from eve_blue_overtime_rate_settings
                where status='A'
                and salaryComponent is not null
                and tempId=:tempId

                `, {
                replacements: {
                    tempId: tempId

                }, type: QueryTypes.SELECT
            }
            )


            if (overtimeSql.length > 0) {

                await Promise.all(overtimeSql.map(async e => {
                    let templateId = e.tempId
                    noOfTimes = e.noOfTimes !== null ? parseFloat(e.noOfTimes) : 1
                    let salaryComponent = (e.salaryComponent).split(',')

                    await Promise.all(salaryComponent.map(async x => {
                        const overtimeSql2 = await db.query(
                            `
                            select * from eve_blue_set_monthly_salary_employee_wise
                            where status='A'
                            and salaryTempId=:salaryTempId
                            and salaryId=:salaryId
                            and employeeId=:employeeId
                            `, {
                            replacements: {
                                salaryTempId: templateId,
                                salaryId: x,
                                employeeId: employeeId,
                            }, type: QueryTypes.SELECT
                        }
                        )


                        // if(overtimeSql2.length>0){

                        //     if(overtimeSql2[0].salaryTempId===templateId){
                        //         noOfTimes=overtimeSql[0].noOfTimes

                        // }
                        // }


                        if (overtimeSql2.length > 0) {
                            await Promise.all(overtimeSql2.map(async z => {
                                amount += parseFloat(z.salaryAmount)

                            }))
                        }
                    }))
                }))
            }

            // console.log((overtimeHrs));
            // let soutHrs = parseInt(clockOut.split(':')[0])
            // let soutmin = parseInt(clockOut.split(':')[1])
            // let sinhrs = parseInt(clockIn.split(':')[0])
            // let sinmin = parseInt(clockIn.split(':')[1])
            // // console.log(soutHrs,soutmin,sinhrs,sinmin);

            // let cheoutTotalMin = soutHrs * 60 + soutmin
            // let cheinTotalMin = sinhrs * 60 + sinmin

            // let shiftTotalMin = cheoutTotalMin - cheinTotalMin
            // shiftHours = shiftTotalMin / 60;


            // let totalApproveHourApp = hoursAndMins(totalApprovehour1)
            // // console.log(shiftHours,totalApproveHourApp);


            // let hrsApp = totalApproveHourApp.split(':')

            // let appHrs = hrsApp[0]
            // let appMin = hrsApp[1]
            // if (appMin > 30) {
            //     totalApprovehour = parseInt(appHrs + 1)
            // }
            // else {
            //     totalApprovehour = parseInt(appHrs)
            // }




            overtimeTotalAmount = (amount * noOfTimes * overtimeHrs)

        }
        else {
            overtimeTotalAmount = 0
        }

    }
    else {
        overtimeTotalAmount = 0
    }
    return overtimeTotalAmount

}
function hoursAndMins(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}


async function getBranchIdByEmployeeId(id, db) {
    const sqlSearchBranchId = await db.query(
        `
        select employeeBranchId from eve_acc_employee
        where id=:id
        and status='A'
        `, {
        replacements: { id }, type: QueryTypes.SELECT
    }
    )
    if (sqlSearchBranchId[0]) {
        return sqlSearchBranchId[0]['employeeBranchId']
    }
    else {
        return ''
    }
}
async function getFixWeeklyOffDay(empId, empBranchId, db) {
    const sql = await db.query(
        `
        select *  from eve_acc_company_fix_weekly_holiday
        where empId=:empId
        and branchId=:empBranchId
        and status='A'
        and empWise='yes'
        `, {
        replacements: {
            empId: empId,
            empBranchId: empBranchId
        }, type: QueryTypes.SELECT
    }
    )


    if (sql[0]) {
        return sql[0]['day']

    }
    else {
        const sql2 = await db.query(
            `
            select *  from eve_acc_company_fix_weekly_holiday
            where branchId=:empBranchId
            and status='A'
            and empWise != 'yes'
            `, {
            replacements: { empBranchId }, type: QueryTypes.SELECT
        }
        )
        if (sql2[0]) {


            return sql2[0]['day']
        }
        else {
            return ''
        }
    }



}
async function getRoasterWiseOffday(empId, startDate, endDate, db) {
    const sqlRoaster = await db.query(
        `
        select fromDate,toDate from eve_hrm_employee_roaster
        where status='A'
        and employeeId=:empId
        and shiftId='0'
        and fromDate >= :startDate
        and toDate <= :endDate
        `, {
        replacements: { empId, startDate, endDate }, type: QueryTypes.SELECT
    }
    )
    if (sqlRoaster.length > 0) {
        const dates = [];
        await Promise.all(sqlRoaster.map(async e => {
            let toDate = new Date(e.toDate);
            let currentDate = new Date(e.fromDate);
            while (currentDate <= toDate) {
                dates.push(currentDate.toISOString().split('T')[0]); // Format as 'YYYY-MM-DD'
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }))
        return dates
    }
    else {
        return ''
    }
}

async function checkSetHolidayDate(date, tokenBranchId, db) {
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

async function additionalWeeklyOffDay(empBranchId, year, month, db) {
    const sqlCompanyHldy = await db.query(`
        SELECT day, weeks 
        FROM eve_acc_company_weekly_holiday 
        WHERE status = "A" AND branchId = :branchId
    `, {
        replacements: { branchId: empBranchId },
        type: QueryTypes.SELECT
    });

    const weekMap = {
        '1st': 1,
        '2nd': 2,
        '3rd': 3,
        '4th': 4,
        '5th': 5,
    };

    const dayMap = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
    };

    const finalDates = [];

    sqlCompanyHldy.forEach(rule => {
        const targetDay = dayMap[rule.day];
        const targetWeeks = rule.weeks.split(',').map(w => weekMap[w.trim()]);

        let date = new Date(Date.UTC(year, month - 1, 1)); // Use UTC to avoid timezone issues
        let weekdayCount = 0;

        while (date.getUTCMonth() === month - 1) {
            if (date.getUTCDay() === targetDay) {
                weekdayCount++;
                if (targetWeeks.includes(weekdayCount)) {
                    // Format the date to YYYY-MM-DD
                    const yyyy = date.getUTCFullYear();
                    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const dd = String(date.getUTCDate()).padStart(2, '0');
                    finalDates.push(`${yyyy}-${mm}-${dd}`);
                }
            }
            date.setUTCDate(date.getUTCDate() + 1);
        }
    });

    return finalDates;
}

function getColumnLetter(columnNumber) {
    let columnName = '';
    while (columnNumber > 0) {
        let remainder = (columnNumber - 1) % 26;
        columnName = String.fromCharCode(65 + remainder) + columnName;
        columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnName;
}

// async function getCalculateRoundOffOvertimeEdit(overTimeTotalHoursMin,db){
//     const sql=await db.query(` SELECT overtime_min FROM eve_blue_overtime_settings where status='A'
//                                 ORDER BY id DESC LIMIT 1

//                 `,{
//                     replacements:{

//                     },type: QueryTypes.SELECT
//                 })

//     if(!sql[0] && !sql[0].overtime_min){
//         return overTimeTotalHoursMin
//     }
//     let roundingInterval = sql[0].overtime_min
//     let [hours, minutes] = overTimeTotalHoursMin.split(':').map(Number);

//     if (roundingInterval) {
//         let totalMinutes = hours * 60 + minutes;
//         let roundedMinutes = Math.round(totalMinutes / roundingInterval) * roundingInterval;
//         let roundedHours = Math.floor(roundedMinutes / 60);
//         let remainingMinutes = roundedMinutes % 60;
//         return `${String(roundedHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
//     }
// }

async function getCalculateRoundOffOvertimeEdit(overTimeTotalHoursMin, db) {
    const sql = await db.query(
        `SELECT overtime_min FROM eve_blue_overtime_settings WHERE status = 'A' ORDER BY id DESC LIMIT 1`,
        { type: QueryTypes.SELECT }
    );

    if (!sql[0] || !sql[0].overtime_min) {
        return overTimeTotalHoursMin;
    }

    let roundingInterval = sql[0].overtime_min;
    let [hours, minutes] = overTimeTotalHoursMin.split(':').map(Number);

    // Calculate total minutes
    let totalMinutes = hours * 60 + minutes;

    // Check if time is less than 60 minutes
    if (totalMinutes < 60) {
        return '00:00';
    }

    // Perform rounding if time is 1 hour or more
    if (roundingInterval) {
        let roundedMinutes = Math.round(totalMinutes / roundingInterval) * roundingInterval;
        let roundedHours = Math.floor(roundedMinutes / 60);
        let remainingMinutes = roundedMinutes % 60;
        return `${String(roundedHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
    }

    return overTimeTotalHoursMin; // Fallback return
}
async function getCalculateRoundOffOvertimeEditWc(overTimeTotalHoursMin, db) {
    const sql = await db.query(
        `
        SELECT overtime_min 
        FROM eve_overtime_settings 
        WHERE status = 'A' 
        ORDER BY id DESC LIMIT 1
        `,
        { type: QueryTypes.SELECT }
    );

    if (!sql[0] || !sql[0].overtime_min) {
        return overTimeTotalHoursMin;
    }

    let roundingInterval = sql[0].overtime_min;
    let [hours, minutes] = overTimeTotalHoursMin.split(':').map(Number);

    // Calculate total minutes
    let totalMinutes = hours * 60 + minutes;

    // Check if time is less than 60 minutes
    if (totalMinutes < 60) {
        return '00:00';
    }

    // Perform rounding if time is 1 hour or more
    if (roundingInterval) {
        let roundedMinutes = Math.round(totalMinutes / roundingInterval) * roundingInterval;
        let roundedHours = Math.floor(roundedMinutes / 60);
        let remainingMinutes = roundedMinutes % 60;
        return `${String(roundedHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
    }

    return overTimeTotalHoursMin; // Fallback return
}

function safeParse(val) {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
}

function roundDownToHour(timeStr) {
    const [hours, _] = timeStr.split(":");
    return `${hours.padStart(2, '0')}:00`;
}

function htmlExtractText(html) {
    // Remove all HTML tags
    let text = html.replace(/<[^>]*>/g, '');

    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&ndash;/g, '-')  // en dash
        .replace(/&mdash;/g, '—')  // em dash
        .replace(/&hellip;/g, '…') // ellipsis
        .replace(/&rsquo;/g, '`')  // right single quote
        .replace(/&lsquo;/g, '`')  // left single quote
        .replace(/&rdquo;/g, '”')  // right double quote
        .replace(/&ldquo;/g, '“'); // left double quote

    // Collapse multiple spaces and trim
    return text.replace(/\s+/g, ' ').trim();
}


const getIncidentPriority = async (idString, db) => {
    // Validate input
    if (!idString || typeof idString !== 'string' || idString.trim() === '') {
        return '';
    }

    // Convert comma-separated string to array of trimmed IDs
    const ids = idString.split(',').map(x => x.trim()).filter(Boolean);


    if (ids.length === 0) {
        return '';
    }

    // Query category names
    const result = await db.query(
        `SELECT priority FROM eve_acc_incident_category_master 
        WHERE id IN (:ids)`,
        {
            replacements: { ids },
            type: QueryTypes.SELECT
        }
    );

    // Extract and join names
    const categoryNames = result.map(row => row.priority).join(' , ');
    return categoryNames;
};
function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function getMultiAttendanceWorkingHour(
    empId,
    date,
    officetotalWorkingHour,
    officelunchIn,
    officelunchOut,
    minWorkingHour,
    intime,
    outime,
    startLunch,
    endLunch,
    db
) {
    const res = await db.query(`
        SELECT a.intime, a.outTime, a.clockin_date, a.clockout_date, a.empId, a.date
        FROM eve_acc_employee_multiple_attendence AS a
        WHERE a.status='A'
        AND a.empId=:empId
        AND date=:date
        AND (a.intime IS NOT NULL AND a.outTime IS NOT NULL)
    `, {
        replacements: { empId, date },
        type: QueryTypes.SELECT
    });
    // console.log(res);


    const resOld = await db.query(`
        SELECT a.intime, a.outTime, a.clockout_date, a.empId, a.date, a.startLunch, a.endLunch
        FROM eve_acc_employee_attendence AS a
        WHERE a.status='A'
        AND a.empId=:empId
        AND date=:date
        AND (a.intime IS NOT NULL AND a.outTime IS NOT NULL)
    `, {
        replacements: { empId, date },
        type: QueryTypes.SELECT
    });

    let totalLunchSeconds = 0;
    let totalSeconds = 0;

    if (res.length > 0) {
        let lunchDeducted = false;

        res.forEach((value) => {
            const inTime = value.intime;
            const outTime = value.outTime;
            const inDate = value.clockin_date ?? value.date;
            const outDate = value.clockout_date ?? value.date;
            const date = value.date;
            const startLunch = resOld[0]?.startLunch;
            const endLunch = resOld[0]?.endLunch;

            const inDateTime = new Date(`${inDate} ${inTime}`).getTime();
            const outDateTime = new Date(`${outDate} ${outTime}`).getTime();

            let diffSeconds = outDateTime - inDateTime;

            if (!lunchDeducted) {
                let startLunchTime, endLunchTime;


                if (startLunch && endLunch && startLunch !== '00:00:00' && endLunch !== '00:00:00') {
                    startLunchTime = new Date(`${res[0].date} ${startLunch}`).getTime();
                    endLunchTime = new Date(`${res[0].date} ${endLunch}`).getTime();
                } else {
                    startLunchTime = new Date(`${res[0].date} ${officelunchIn}`).getTime();
                    endLunchTime = new Date(`${res[0].date} ${officelunchOut}`).getTime();
                }

                if (endLunchTime > startLunchTime) {
                    let lunchSeconds = endLunchTime - startLunchTime;
                    if (lunchSeconds < diffSeconds) {
                        diffSeconds -= lunchSeconds;
                        lunchDeducted = true;
                    }
                }
            }

            let lunchSeconds1 = 0;
            if (startLunch && endLunch && startLunch !== '00:00:00' && endLunch !== '00:00:00') {
                const startLunchTime = new Date(`${res[0].date} ${startLunch}`).getTime();
                const endLunchTime = new Date(`${res[0].date} ${endLunch}`).getTime();
                if (endLunchTime > startLunchTime) {
                    lunchSeconds1 = endLunchTime - startLunchTime;
                }
            } else {
                const startLunchTime = new Date(`${res[0].date} ${officelunchIn}`).getTime();
                const endLunchTime = new Date(`${res[0].date} ${officelunchOut}`).getTime();
                if (endLunchTime > startLunchTime) {
                    lunchSeconds1 = endLunchTime - startLunchTime;
                }
            }


            totalLunchSeconds = lunchSeconds1;
            totalSeconds += diffSeconds;

        });



        const totalWorkingHour = moment.utc(totalSeconds).format('HH:mm');

        const totalWorkingHoursMillis = totalSeconds;
        const totalBreakHourMillis = (totalLunchSeconds)
        const totalBreakHour = moment.utc(totalBreakHourMillis).format('HH:mm');
        const minHourStatus = totalWorkingHour >= minWorkingHour ? 'yes' : 'no';

        return {
            date,
            totalWorkingHour,
            totalWorkingHoursMillis,
            totalBreakHour,
            totalBreakHourMillis,
            minHourStatus,
            intime,
            outime,
            startLunch,
            endLunch,
        };
    } else if (resOld.length > 0) {
        const old = resOld[0];

        const inDateTime = new Date(`${old.date} ${old.intime}`).getTime();
        const outDateTime = new Date(`${old.clockout_date ?? old.date} ${old.outTime}`).getTime();
        let diffSeconds = outDateTime - inDateTime;

        let startLunchTime, endLunchTime;
        if (old.startLunch && old.endLunch && old.startLunch !== '00:00:00' && old.endLunch !== '00:00:00') {
            startLunchTime = new Date(`${old.date} ${old.startLunch}`).getTime();
            endLunchTime = new Date(`${old.date} ${old.endLunch}`).getTime();
        } else {
            startLunchTime = new Date(`${old.date} ${officelunchIn}`).getTime();
            endLunchTime = new Date(`${old.date} ${officelunchOut}`).getTime();
        }

        if (endLunchTime > startLunchTime) {
            const lunchSeconds = endLunchTime - startLunchTime;
            if (lunchSeconds < diffSeconds) {
                diffSeconds -= lunchSeconds;
            }
            totalLunchSeconds = lunchSeconds;
        }

        totalSeconds = diffSeconds;

        const totalWorkingHour = moment.utc(totalSeconds).format('HH:mm');
        const totalWorkingHoursMillis = totalSeconds;
        const totalBreakHour = moment.utc(totalLunchSeconds).format('HH:mm');
        const totalBreakHourMillis = totalLunchSeconds;
        const minHourStatus = totalWorkingHour >= minWorkingHour ? 'yes' : 'no';
        let single = 'single'

        return {
            date: old.date,
            totalWorkingHour,
            totalWorkingHoursMillis,
            totalBreakHour,
            totalBreakHourMillis,
            minHourStatus,
            intime: old.intime,
            outime: old.outTime,
            startLunch: old.startLunch,
            endLunch: old.endLunch,
            key: single
        };
    } else {
        return {
            date,
            totalWorkingHour: '00:00',
            totalWorkingHoursMillis: 0,
            totalBreakHour: '00:00',
            totalBreakHourMillis: 0,
            minHourStatus: 'no',
            intime,
            outime,
            startLunch,
            endLunch,
        };
    }
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

// async function getMultiAttendanceWorkingHour(empId, date, officetotalWorkingHour, officelunchIn, officelunchOut, minWorkingHour, intime,outime,startLunch,endLunch,db) {

//     const res = await db.query(`
//         SELECT a.intime,a.outTime,a.clockin_date,a.clockout_date,a.empId,a.date
//         FROM eve_acc_employee_multiple_attendence AS a
//         WHERE a.status='A'
//         AND a.empId=:empId
//         AND date=:date
//          AND (a.intime IS NOT NULL  AND a.outTime IS NOT NULL)
//     `, {
//         replacements: {
//             empId: empId,
//             date: date
//         }, type: QueryTypes.SELECT
//     })


//     const resOld = await db.query(`
//         SELECT a.intime,a.outTime,a.clockout_date,a.empId,a.date,a.startLunch,a.endLunch
//         FROM eve_acc_employee_attendence AS a
//         WHERE a.status='A'
//         AND a.empId=:empId
//         AND date=:date
//         AND (a.intime IS NOT NULL  AND a.outTime IS NOT NULL)
//         `, {
//             replacements: {
//                 empId: empId,
//                 date: date
//             }, type: QueryTypes.SELECT
//         })

//         let totalLunchSeconds = 0
//         let totalSeconds = 0;
//         if (res.length > 0) {
//         // console.log(resOld);
//         res.forEach((value, key) => {
//             const inTime = value.intime;
//             const outTime = value.outTime;
//             const inDate = value.clockin_date ?? value.date;
//             const outDate = value.clockout_date ?? value.date;
//             const date = value.date;
//             const startLunch = resOld[0]?.startLunch;
//             const endLunch = resOld[0]?.endLunch;

//             const inDateTime = new Date(`${inDate} ${inTime}`).getTime();
//             const outDateTime = new Date(`${outDate} ${outTime}`).getTime();

//             let diffSeconds = outDateTime - inDateTime
//             // moment.utc(diffSeconds).format('HH:mm')

//             if (startLunch && endLunch && startLunch != '00:00:00' && endLunch != '00:00:00') {
//                 const startLunchTime = new Date(`${res[0].date} ${startLunch}`).getTime();
//                 const endLunchTime = new Date(`${res[0].date} ${endLunch}`).getTime();
//                 if (endLunchTime > startLunchTime) {
//                     let lunchSeconds = endLunchTime - startLunchTime;
//                     // console.log(moment.utc(lunchSeconds).format('HH:mm'),date);
//                     if (lunchSeconds < diffSeconds) {
//                         diffSeconds -= lunchSeconds;

//                     }
//                 }
//             }
//             else {
//                 const startLunchTime = new Date(`${res[0].date} ${officelunchIn}`).getTime();
//                 const endLunchTime = new Date(`${res[0].date} ${officelunchOut}`).getTime();
//                 if (endLunchTime > startLunchTime) {
//                     let lunchSeconds = endLunchTime - startLunchTime;
//                     if (lunchSeconds < diffSeconds) {
//                         diffSeconds -= lunchSeconds;
//                     }
//                 }
//             }

//             // calculate lunch hours
//             if (startLunch && endLunch && startLunch != '00:00:00' && endLunch != '00:00:00') {
//                 // Prevent negative or zero lunch duration
//                 const startLunchTime = new Date(`${res[0].date} ${startLunch}`).getTime();
//                 const endLunchTime = new Date(`${res[0].date} ${endLunch}`).getTime();
//                 if (endLunchTime > startLunchTime) {
//                     let lunchSeconds1 = endLunchTime - startLunchTime;
//                     totalLunchSeconds = lunchSeconds1; // ✅ accumulate total lunch time
//                 }
//             }
//             else {
//                 const startLunchTime = new Date(`${res[0].date} ${officelunchIn}`).getTime();
//                 const endLunchTime = new Date(`${res[0].date} ${officelunchOut}`).getTime();
//                 if (endLunchTime > startLunchTime) {
//                     let lunchSeconds1 = endLunchTime - startLunchTime;
//                     totalLunchSeconds = lunchSeconds1; // ✅ accumulate total lunch time
//                 }
//             }

//             totalSeconds += diffSeconds


//         })

//         let totalWorkingHour = moment.utc(totalSeconds).format('HH:mm')
//         let totalWorkingHoursMillis = totalSeconds
//         let totalBreakHour = moment.utc(totalLunchSeconds).format('HH:mm')
//         let totalBreakHourMillis = totalLunchSeconds

//         let minHourStatus
//         if (totalWorkingHour >= minWorkingHour) {
//             minHourStatus = 'yes';
//         } else {
//             minHourStatus = 'no';

//         }
//         return {
//             date,
//             totalWorkingHour,
//             totalWorkingHoursMillis,
//             totalBreakHour,
//             totalBreakHourMillis,
//             minHourStatus,intime,outime, startLunch,
//             endLunch,
//         };
//     }
//     else{
//         let multi='no'
//         return {
//             date,
//             intime,
//             outime,
//             startLunch,
//             endLunch,
//             multi,

//         }
//     }




// }


// let totalSeconds = 0;
// let totalLunchSeconds = 0;

// if (res.length > 0) {
//     res.forEach(value => {
//         const inTime = value.intime;
//         const outTime = value.outTime;
//         const inDate = value.clockin_date ?? value.date;
//         const outDate = value.clockout_date ?? value.date;
//         const date = value.date;

//         const inDateTime = new Date(`${inDate} ${inTime}`).getTime();
//         const outDateTime = new Date(`${outDate} ${outTime}`).getTime();

//         let diffSeconds = outDateTime - inDateTime;

//         // Lunch deduction logic
//         let startLunch = resOld[0]?.startLunch;
//         let endLunch = resOld[0]?.endLunch;

//         if (startLunch && endLunch && startLunch !== '00:00:00' && endLunch !== '00:00:00') {
//             const startLunchTime = new Date(`${inDate} ${startLunch}`).getTime();
//             const endLunchTime = new Date(`${outDate} ${endLunch}`).getTime();

//             if (endLunchTime > startLunchTime) {
//                 const lunchSeconds = endLunchTime - startLunchTime;
//                 if (lunchSeconds < diffSeconds) {
//                     diffSeconds -= lunchSeconds;
//                 }
//                 totalLunchSeconds += lunchSeconds;
//             }
//         } else {
//             const startLunchTime = new Date(`${inDate} ${officelunchIn}`).getTime();
//             const endLunchTime = new Date(`${outDate} ${officelunchOut}`).getTime();

//             if (endLunchTime > startLunchTime) {
//                 const lunchSeconds = endLunchTime - startLunchTime;
//                 if (outTime > officelunchOut && lunchSeconds < diffSeconds) {
//                     diffSeconds -= lunchSeconds;
//                 }
//                 totalLunchSeconds += lunchSeconds;
//             }
//         }

//         totalSeconds += diffSeconds;

//         // console.log(totalSeconds);
//         // console.log(totalWorkingHour,date);

//     });
// }
// const totalWorkingHour = moment.utc(totalSeconds).format("HH:mm:ss");
// const totalBreakHour = moment.utc(totalLunchSeconds).format("HH:mm:ss");

// return {
//     totalWorkingHour, totalBreakHour,
//     date
// };


// console.log("Total Break Hour:", totalBreakHour);

























module.exports =
{
    roundDownToHour, getIncidentCategoryName, getIncidentPriority, capitalizeFirstLetter, getMultiAttendanceWorkingHour, isMultiEmployee, isLunchInBetween,
    getEmployeeNameById,
    getEmpMobNoByEmpId,
    getEmpEmailByEmpId,
    departmentNameByDepartmentId,
    convertTimeToMinutes,
    moduleActivation,
    getBranchNameByBranchId,
    getDesignationNameById,
    getSubDepartmentNameBySubDepartmentId,
    formatAmount,
    getDaysInMonth,
    decode,
    encode,
    convertMinutesToHHMM,
    subtractTime,
    convertDateDDMMYYYY,
    getAssetCategoryName,
    getAssetName,
    statusColor,
    reorderObjectProperties,
    arrangeKeys,
    convertMonthName,
    getSubCompanyNameById,
    getEmpCodeFromEmpId,
    getDepartmentNameByDepartmentId,
    getDesignationIdFromEmpId,
    taggedResponsiblePerson,
    replaceEmptyValues,
    getLocationNameById,
    leaveType,
    getleaveNameById,
    getEmpTypeName,
    getWorkTypeName,
    getReferenceNameById,
    getEmpEducationDegree,
    getEmpNationality,
    getDocumentNameById,
    replaceEmptyValuesApi,
    getInterviewStatus,
    openSSLDecryption,
    addTimes,
    getShiftNameById,
    getCheckListCategoryNameById,
    getCheckListNameById,
    formatTime,
    extractText,
    validateTime,
    getEmployeeWiseOfficeSchedule,
    formatDateCombine,
    calculateWorkingHours,
    getDaysPassedInMonth,
    weeklyHolidayArrayFn,
    getExtraDutyAmountByEmployeeId,
    getOvertimeAmountByEmployeeId,
    hoursAndMins,
    getBranchIdByEmployeeId,
    getFixWeeklyOffDay,
    getRoasterWiseOffday,
    checkSetHolidayDate,
    additionalWeeklyOffDay,
    getColumnLetter,
    getWagesOtAmntByEmpIdDayWise,
    getTemplateNameById,
    getEmployeeWiseOfficeScheduleWages,
    getbranchStateName,
    getCalculateRoundOffOvertimeEdit,
    convertToHours,
    safeParse,
    getCalculateRoundOffOvertimeEditWc,
    getEmployeeWiseOfficeScheduleBc,
    htmlExtractText,
    getShiftName, getCompanyLateTimeEnd,isValidWorkingHour

}


