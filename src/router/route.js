const express = require('express')

const router = express.Router()

const middleWare=require('../middleWare/auth')

const multer=require('multer')

const path = require('path');

// Define upload destination
const upload = multer({
  dest: path.join(__dirname, '../../upload/') // adjust path based on your folder structure
});


// const biometricAttendanceImport=require('../controllers/setting/api/biometricAttendanceImport')

// router.post('/setting/getBiometricAttendanceImport',middleWare.auth,upload.single('excelFile'),biometricAttendanceImport.getBiometricAttendanceImport
// );

//controller

const getController = require('../controller/database')

const empListCommonDropDownController = require('../controller/empListCommonDropDownController')

const employeeSalaryReport=require('../controller/employeeSalaryReport')

const employeeAttendanceNewReport=require('../controller/employeeAttendanceNewReport')

const taReport=require('../controller/taReport')

const reimbursmentReport=require('../controller/reimbursmentReport')

const advanceReport=require('../controller/advanceReport')

const extraDutyReport=require('../controller/extraDutyReport')

const resignationReport=require('../controller/resignationReport')

const gratuityReport=require('../controller/gratuityReport')

const incidentReport = require('../controller/incidentReport')

const attendanceRegularizationReport=require('../controller/attendanceRegularizationReport')

const tdsReport=require('../controller/tdsReport')

const salaryReport=require('../controller/salaryReport')

const pfReport=require('../controller/pfReport')

const leaveBalanceReport=require('../controller/leaveBalanceReport')

const compOffReport=require('../controller/compOffReportAll')

const latePunchDeductionReport=require('../controller/latePunchDeductionReport')

const vpfReport=require('../controller/vpfReport')

const smsReport=require('../controller/smsReport')

const overtimeReport=require('../controller/overtimeReport')

const companyPolicyAcceptance=require('../controller/companyPolicyAcceptance')

const allCostCenterReport=require('../controller/allCostCenterReport')

const employeeList=require('../controller/employeeList')

const monthlyAttendance=require('../controller/monthlyAttendance')

const approvalsGratuityList=require('../controller/approvalsGratuityList')









/*********************************Main Api***********************/





router.get('/getOn', getController.getEmpMaster)



router.post('/report/getEmployeeAttendanceNewReport', middleWare.auth,employeeAttendanceNewReport.getEmployeeAttendanceNewReport)

// router.get('report',getController.getEmployeeAttendanceNewReport)



router.get('/getAllEmployeeListOnlyForSearch', empListCommonDropDownController.getAllEmployeeListOnlyForSearch)



router.get('/report/employeeSalaryReport',employeeSalaryReport.getEmployeeSalaryReport)



router.get('/report/allTaList',taReport.allTaList)



router.get('/report/allReimbursmentReport',reimbursmentReport.getAllReimbursmentReport)



router.get('/report/allAdvanceReport',advanceReport.getAllAdvanceReport)



router.get('/report/allListTodayforReport',extraDutyReport.allListTodayforReport)



router.get('/report/getResignationReport',resignationReport.getResignationReport)



router.get('/report/getGratuityReport',gratuityReport.getGratuityReport)



router.get('/report/getIncidentReport',incidentReport.getIncidentReport)



router.get('/report/getAttendanceRegularizationReport',attendanceRegularizationReport.getAttendanceRegularizationReport)



router.get('/report/getTdsReport',tdsReport.getTdsReport)



router.get('/report/getSalaryReport',salaryReport.getSalaryReport)



router.get('/report/getPfReport',pfReport.getPfReport)



router.get('/report/getLeaveBalanceReport',leaveBalanceReport.getLeaveBalanceReport)



router.get('/report/getCompOffReport',compOffReport.getCompOffReport)



router.get('/report/getLatePunchDeductionReport',latePunchDeductionReport.getLatePuchDeductionReport)



router.get('/report/getVpfReport',vpfReport.getVpfReport)

router.get('/report/getSmsReport',smsReport.getSmsReport)

router.post('/report/getOvertimeReport',overtimeReport.getOvertimeReport)

router.get('/report/getCompanyPolicyAcceptance',companyPolicyAcceptance.getCompanyPolicyAcceptance)

router.get('/report/getAllCostCenterReport',allCostCenterReport.getAllCostCenterReport)



router.post('/report/getEmpList',middleWare.auth,employeeList.getEmpList)



router.post('/report/getMonthlyAttendance',middleWare.auth,monthlyAttendance.getMonthlyAttendance)



//payrolGratuityList

router.post('/approvals/getPayrolGratuityList',middleWare.auth,approvalsGratuityList.getApprovalsGratuityList)



































//                                                  excelApi



//controller

const taReportExcel=require('../excelController/taReportExcel')

const salaryReportExcel=require('../excelController/salaryReportExcel')

const pfReportExcel=require('../excelController/pfReportExcel')

const leaveBalanceReportExcel=require('../excelController/leaveBalanceReportExcel')

const latePunchDeductionReportExcel=require('../excelController/latePunchDeductionReportExcel')

const getAttendanceRegularizationReportExcel=require('../excelController/attendanceRegularizationReportExcel')

const vpfReportExcel=require('../excelController/vpfReportExcel')

const costCenterReportExcel=require('../excelController/costCenterReportExcel')

const companyPolicyAcceptanceExcel=require('../excelController/companyPolicyAcceptanceExcel')

const incidentReportExcel=require('../excelController/incidentReportExcel')

const gratuityReportExcel=require('../excelController/gratuityReportExcel')

const resignationReportExcel=require('../excelController/resignationReportExcel')

const extraDutyReportExcel=require('../excelController/extraDutyReportExcel')

const tdsReportExcel=require('../excelController/tdsReportExcel')

const reimbursmentReportExcel=require('../excelController/reimbursmentReportExcel')

const attendanceReportExcel=require('../excelController/attendanceReportExcel')

const overtimeReportExcel=require('../excelController/overTimeReportExcel')

const overtimeEditReportExcel=require('../excelController/overTimeEditReportExcel')

const empListExcel=require('../excelController/employeeListExcel')

const monthlyAttendanceExcel=require('../excelController/monthlyAttendanceExcel')

const overtimeApproveExcel=require('../excelController/overtimeApproveExcel')

const allotAssetListExcel=require('../excelController/allotAssetListExcel')

const requestAssetListExcel=require('../excelController/requestAssetExcel')

const acceptAlottedAssetExcel=require('../excelController/acceptAllotedAssetExcel')

const requestAssetSupervisorExcel=require('../excelController/requestAssetSupervisorExcel')

const requestAssetReturnListExcel=require('../excelController/requestAssetReturnListExcel')

const requestAssetApprovalReturnListExcel=require('../excelController/requestAssetApprovalReturnListExcel')



const payslipExcel=require('../excelController/payslipExcel')

const payableSalaryExcel=require('../excelController/payableSalaryExcel')









//api

//taReport

router.get('/report/getTaReportExel',taReportExcel.getTaReportExcel)

router.get('/report/getTaReportExelSheet',taReportExcel.getTaReportExcelSheet)





//salaReportExcel

router.get('/report/getSalaryReportExcel',salaryReportExcel.getSalaryReportExcel)

router.get('/report/getSalaryReportExcelSheet',salaryReportExcel.getSalaryReportExcelSheet)



//pfReportExcel

router.get('/report/getPfReportExcel',pfReportExcel.getPfReportExcel)

router.get('/report/getPfReportExcelSheet',pfReportExcel.getPfReportExcelSheet)



//leaveBalanceReportExcel

router.get('/report/getLeaveBalanceReportExcel',leaveBalanceReportExcel.getLeaveBalanceReportExcel)

router.get('/report/getLeaveBalanceReportExcelSheet',leaveBalanceReportExcel.getLeaveBalanceReportExcelSheet)



//latePunchDeductionReportExcel

router.get('/report/getLatePunchDeductionReportExcel',latePunchDeductionReportExcel.getLatePuchDeductionReportExcel)

router.get('/report/getLatePunchDeductionReportExcelSheet',latePunchDeductionReportExcel.getLatePuchDeductionReportExcelSheet)





//AttendanceRegularizationReportExcel

router.get('/report/getAttendanceRegularizationReportExcel',getAttendanceRegularizationReportExcel.getAttendanceRegularizationReportExcel)

router.get('/report/getAttendanceRegularizationReportExcelSheet',getAttendanceRegularizationReportExcel.getAttendanceRegularizationReportExcelSheet)







//vpfReportExcel

router.get('/report/getVpfReportExcel',vpfReportExcel.getVpfReportExcel)

router.get('/report/getVpfReportExcelSheet',vpfReportExcel.getVpfReportExcelSheet)





//costCentreReportExcel

router.get('/report/getCostCenterReportExcel',costCenterReportExcel.getCostCenterReportExcel)

router.get('/report/getCostCenterReportExcelSheet',costCenterReportExcel.getCostCenterReportExcelSheet)







//companyPolicyAcceptanceExcel

router.get('/report/getCompanyPolicyAcceptanceExcel',companyPolicyAcceptanceExcel.getCompanyPolicyAcceptanceExcel)

router.get('/report/getCompanyPolicyAcceptanceExcelSheet',companyPolicyAcceptanceExcel.getCompanyPolicyAcceptanceExcelSheet)



//incidentReportExcel

router.get('/report/getIncidentReportExcel',incidentReportExcel.getIncidentReportExcel)

router.get('/report/getIncidentReportExcelSheet',incidentReportExcel.getIncidentReportExcelSheet)





//gratuityReportExcel



router.get('/report/getGratuityReportExcel',gratuityReportExcel.getGratuityReportExcel)

router.get('/report/getGratuityReportExcelSheet',gratuityReportExcel.getGratuityReportExcelSheet)



//resignationReportExcel

router.get('/report/getResignationReportExcel',resignationReportExcel.getResignationReportExcel)

router.get('/report/getResignationReportExcelSheet',resignationReportExcel.getResignationReportExcelSheet)



//extraDutyReportExcel

router.get('/report/getExtraDutyReportExcel',extraDutyReportExcel.allListTodayforReportExcel)

router.get('/report/getExtraDutyReportExcelSheet',extraDutyReportExcel.allListTodayforReportExcelSheet)



//tdsReportExcel

router.get('/report/getTdsReportExcel',tdsReportExcel.getTdsReportExcel)

router.get('/report/getTdsReportExcelSheet',tdsReportExcel.getTdsReportExcelSheet)





//reimbursmentReportExcel

router.get('/report/getReimbursmentReportExcel',reimbursmentReportExcel.getAllReimbursmentReportExcel)

router.get('/report/getReimbursmentReportExcelSheet',reimbursmentReportExcel.getAllReimbursmentReportExcelSheet)





//attendanceReportExcel

router.post('/report/getAttendanceReportExcel',middleWare.auth,attendanceReportExcel.getAttendanceReportExcel)

router.post('/report/getAttendanceReportExcelSheet',middleWare.auth,attendanceReportExcel.getAttendanceReportExcelSheet)



//overtimeReportExcel

router.post('/report/getOverTimeReportExcel',overtimeReportExcel.getOvertimeReportExcel)

router.post('/report/getOverTimeReportExcelSheet',overtimeReportExcel.getOvertimeReportExcelSheet)





//overtimeEditReportExcel

router.post('/report/getOvertimeEditReportExcel',middleWare.auth,overtimeEditReportExcel.getOvertimeEditReportExcel)

router.post('/report/getOvertimeEditReportExcelSheet',middleWare.auth,overtimeEditReportExcel.getOvertimeEditReportExcelSheet)





//employeeListExcel

// router.get('/report/getEmpListExcelSheet',employeeList.getEmpListExcelSheet)

router.post('/report/getEmpListExcel',middleWare.auth,empListExcel.getEmpListExcel)

router.post('/report/getEmpListExcelSheet',middleWare.auth,empListExcel.getEmpListExcelSheet)



//monthlyAttendanceExcel

// router.post('/report/getmonthlyAttendanceExcel',middleWare.auth,monthlyAttendanceExcel.getMonthlyAttendanceExcel)

router.post('/report/getmonthlyAttendanceExcelSheet',middleWare.auth,monthlyAttendanceExcel.getMonthlyAttendanceExcelSheet)



//overtimeApproveExcel

router.post('/multiovertime/getEmployeeOvertimeApproveExcel',overtimeApproveExcel.getEmployeeOvertimeApproveExcel)

router.post('/multiovertime/getEmployeeOvertimeApproveExcelSheet',overtimeApproveExcel.getEmployeeOvertimeApproveExcelSheet)







//AllotAssetListExcel

router.post('/employeeMaster/getAllotAssetListExcel',middleWare.auth,allotAssetListExcel.getAllotAssetListExcel)



router.post('/employeeMaster/getAllotAssetListExcelSheet',middleWare.auth,allotAssetListExcel.getAllotAssetListExcelSheet)





//requestAssetListExcel

router.post('/employeeMaster/getRequestAssetListExcel',middleWare.auth,requestAssetListExcel.getRequestAssetExcel)

router.post('/employeeMaster/getRequestAssetListExcelSheet',middleWare.auth,requestAssetListExcel.getRequestAssetExcelSheet)





//acceptAlottedAssetExcel

router.post('/employeeMaster/getAcceptAlottedAssetExcel',middleWare.auth,acceptAlottedAssetExcel.getAcceptAllotAssetListExcel)

router.post('/employeeMaster/getAcceptAlottedAssetExcelSheet',middleWare.auth,acceptAlottedAssetExcel.getAcceptAllotAssetListExcelSheet)







//RequestAssetSupervisorExcel

router.post('/employeeMaster/getRequestSupervisorAssetListExcel',middleWare.auth,requestAssetSupervisorExcel.getRequestAssetSupervisorExcel)

router.post('/employeeMaster/getRequestSupervisorAssetListExcelSheet',middleWare.auth,requestAssetSupervisorExcel.getRequestAssetSupervisorExcelSheet)





//requestAssetReturnListExcel



router.post('/employeeMaster/getRequestAssetReturnListExcel',middleWare.auth,requestAssetReturnListExcel.getRequestAssetReturnListExcel)

router.post('/employeeMaster/getRequestAssetReturnListExcelSheet',middleWare.auth,requestAssetReturnListExcel.getRequestAssetReturnListExcelSheet)





//getRequestAssetApprovalReturnListExcel

router.post('/employeeMaster/getRequestAssetApprovalReturnListExcel',middleWare.auth,requestAssetApprovalReturnListExcel.getRequestAssetApprovalReturnListExcel)

router.post('/employeeMaster/getRequestAssetApprovalReturnListExcelSheet',middleWare.auth,requestAssetApprovalReturnListExcel.getRequestAssetApprovalReturnListExcelSheet)



//payslip

router.post('/companySalaryStructure/getPayslipExcel',middleWare.auth,payslipExcel.getPayslipExcel)

router.post('/companySalaryStructure/getPayslipExcelSheet',middleWare.auth,payslipExcel.getPayslipExcelSheet)







//payableSalary

router.post('/payableSalary/paybleSalaryExcel',middleWare.auth,payableSalaryExcel.getPayableSalaryExcel)

router.post('/payableSalary/paybleSalaryExcelSheet',middleWare.auth,payableSalaryExcel.getPayableSalaryExcelSheet)



//BonusAllotmentExcel

const bonusAllotmentExcel=require('../excelController/bonusAllotmentExcel')

router.post('/setting/bonus/getBonusAllotmentExcel',bonusAllotmentExcel.getBonusAllotmentExcel)

router.get('/setting/bonus/getBonusAllotmentExcelSheet',bonusAllotmentExcel.getBonusAllotmentExcelSheet)



//                                     sprint7

//1.templateWisePayrollExcel
const templateWisePayrollExcel=require('../controllers/sprint7/excel/templateWisePayrollExcel')
router.post('/payroll/getTemplateWisePayrollExcel',middleWare.auth,templateWisePayrollExcel.getTemplateWisePayrollExcel)
router.post('/payroll/getTemplateWisePayrollExcelSheet',middleWare.auth,templateWisePayrollExcel.getTemplateWisePayrollExcelsheet)

//2. amlPayrollExcel
const amlPayrollExcel=require('../controllers/sprint7/excel/amlPayrollExcel')
router.post('/payroll/getAmlPayrollExcel',middleWare.auth,amlPayrollExcel.getAmlPayrollExcel)
router.post('/payroll/getAmlPayrollExcelSheet',middleWare.auth,amlPayrollExcel.getAmlPayrollExcelSheet)



//3.AttritionReport
const attritionReport=require('../controllers/sprint7/api/attritionReport')
router.post('/reports/getAttritionReport',middleWare.auth,attritionReport.getAttritionReport)

//Excel
const attritionReportExcel=require('../controllers/sprint7/excel/attritionReportExcel')
router.post('/reports/getAttritionReportExcel',middleWare.auth,attritionReportExcel.getAttritionReportExcel)
router.post('/reports/getAttritionReportExcelSheet',middleWare.auth,attritionReportExcel.getAttritionReportExcelSheet)



//                                              sprint 8

//1.AssetRequestReport



//api

const assetRequestReport=require('../controllers/sprint8/api/assetRequestReport')

router.post('/reports/getAssetRequestReport',middleWare.auth,assetRequestReport.getAssetRequestReport)







//2.AssetAllotmentRequest

const assetAllotmentReport=require('../controllers/sprint8/api/assetAllotmentReport')

router.post('/reports/getAssetAllotmentReport',middleWare.auth,assetAllotmentReport.getAssetAllotment)





//3.overtimeReport

const overtimeReports=require('../controllers/sprint8/api/overtimeTimeReports')

router.post('/reports/getOvertimeReports',middleWare.auth,overtimeReports.getOvertimeReport)



//excel

const overtimeReportsExcel=require('../controllers/sprint8/excel/overtimeReportsExcel')

router.post('/reports/getOvertimeReportsExcel',middleWare.auth,overtimeReportsExcel.getOvertimeReportExcel)

router.post('/reports/getOvertimeReportsExcelSheet',middleWare.auth,overtimeReportsExcel.getOvertimeReportExcelSheet)



//4. leaveReports
const leaveReports=require('../controllers/sprint8/api/leaveReports')
router.post('/reports/getLeaveReports',middleWare.auth,leaveReports.getLeaveReports)

//LeaveReportsHeader
router.post('/reports/getLeaveReportsHeader',middleWare.auth,leaveReports.getLeaveReportsHeader)

//Excel
const leaveReportsExcel=require('../controllers/sprint8/excel/leaveReportsExcel')
router.post('/reports/getLeaveReportsExcel',middleWare.auth,leaveReportsExcel.getLeaveReportsExcel)

router.post('/reports/getLeaveReportsExcelSheets',middleWare.auth,leaveReportsExcel.getLeaveReportsExcelSheet)


//6.companyPolicyAcceptanceReport
//Excel
const companyPolicyReportExcel=require('../controllers/sprint8/excel/CompanyPolicyReportExcel')
router.post('/reports/getCompanyPolicyReportExcel',middleWare.auth,companyPolicyReportExcel.getCompanyPolicyReportExcel)
router.post('/reports/getCompanyPolicyReportExcelSheet',middleWare.auth,companyPolicyReportExcel.getCompanyPolicyReportExcelSheet)

//AdvanceReport
//Excel
const advanceReportsExcel=require('../controllers/sprint8/excel/advanceReportExcel')
router.post('/reports/getAdvanceReportsExcel',middleWare.auth,advanceReportsExcel.getAdvanceReportExcel)
router.post('/reports/getAdvanceReportsExcelSheet',middleWare.auth,advanceReportsExcel.getAdvanceReportExcelSheet)



//                                                    WhiteCollar

//monthlyAttendanceWc
const monthlyAttendanceWc=require('../controllers/whiteCollar/api/monthlyAttendanceWc')
router.post('/whiteCollar/getMonthlyAttendanceWc',middleWare.auth,monthlyAttendanceWc.getMonthlyAttendanceWc)
//monthlyAttendanceWcExcel
const monthlyAttendanceWcExcel=require('../controllers/whiteCollar/excel/monthlyAttendanceWcExcel')
router.post('/whiteCollar/getMonthlyAttendanceWcExcel',middleWare.auth,monthlyAttendanceWcExcel.getMonthlyAttendanceWcExcel)
router.post('/whiteCollar/getMonthlyAttendanceWcExcelSheet',middleWare.auth,monthlyAttendanceWcExcel.getMonthlyAttendanceWcExcelSheet)

//leaveReportsWc
const leaveReportsWc=require('../controllers/whiteCollar/api/leaveReportsWc')
router.post('/whiteCollar/getLeaveReportsWc',middleWare.auth,leaveReportsWc.getLeaveReportsWc)

//leaveReportsWcExcel
const leaveReportsWcExcel=require('../controllers/whiteCollar/excel/leaveReportsWcExcel')
router.post('/whiteCollar/getLeaveReportsWcExcel',middleWare.auth,leaveReportsWcExcel.getLeaveReportsWcExcel)
router.post('/whiteCollar/getLeaveReportsWcExcelSheet',middleWare.auth,leaveReportsWcExcel.getLeaveReportsWcExcelSheet)

//OvertimeReportWc
const overtimeReportWc=require('../controllers/whiteCollar/api/overtimeReportsWc')
router.post('/whiteCollar/getOvertimeReportWc',middleWare.auth,overtimeReportWc.getOvertimeReportsWc)

//overtimeReportWcExcel
const overtimeReportWcExcel=require('../controllers/whiteCollar/excel/overtimeReportsWcExcel')
router.post('/whiteCollar/getOvertimeReportWcExcel',middleWare.auth,overtimeReportWcExcel.getOvertimeReportsWcExcel)
router.post('/whiteCollar/getOvertimeReportWcExcelSheet',middleWare.auth,overtimeReportWcExcel.getOvertimeReportsWcExcelSheet)



//inductionsListExcel
const inductionsListExcel=require('../controllers/whiteCollar/excel/inductionsListExcel')
router.post('/whiteCollar/getInductionsListExcel',middleWare.auth,inductionsListExcel.getInductionsListExcel)
router.post('/whiteCollar/getInductionsListExcelSheet',middleWare.auth,inductionsListExcel.getInductionsListExcelSheet)

//employeeVendorListExcel
const employeeVendorListExcel=require('../controllers/whiteCollar/excel/employeeVendorListExcel')
router.post('/whiteCollar/getEmployeeVendorListExcel',middleWare.auth,employeeVendorListExcel.getEmployeeVendorListExcel)
router.post('/whiteCollar/getEmployeeVendorListExcelSheet',middleWare.auth,employeeVendorListExcel.getEmployeeVendorListExcelSheet)

//ChecklistCategoryExcel
const checklistCategoryExcel=require('../controllers/whiteCollar/excel/checklistCategoryExcel')
router.post('/whiteCollar/getChecklistCategoryExcel',middleWare.auth,checklistCategoryExcel.getChecklistCategoryExcel)
router.post('/whiteCollar/getChecklistCategoryExcelSheet',middleWare.auth,checklistCategoryExcel.getChecklistCategoryExcelSheet)


//allotCheckListExcel
const allotCheckListExcel=require('../controllers/whiteCollar/excel/allotChecklistExcel')
router.post('/whiteCollar/getAllotCheckListExcel',middleWare.auth,allotCheckListExcel.getAllotChecklistExcel)
router.post('/whiteCollar/getAllotCheckListExcelSheet',middleWare.auth,allotCheckListExcel.getAllotChecklistExcelSheet)


//candidateListExcel
const candidateListExcel=require('../controllers/whiteCollar/excel/candidateListExcel')
router.post('/whiteCollar/getCandidateListExcel',middleWare.auth,candidateListExcel.getCandidateListExcel)
router.post('/whiteCollar/getCandidateListExcelSheet',middleWare.auth,candidateListExcel.getCandidateListExcelSheet)

//interviewRoundExcel
const interviewRoundExcel=require('../controllers/whiteCollar/excel/interviewRoundExcel')
router.post('/whiteCollar/getInterviewRoundExcel',middleWare.auth,interviewRoundExcel.getInterviewRoundExcel)
router.post('/whiteCollar/getInterviewRoundExcelSheet',middleWare.auth,interviewRoundExcel.getInterviewRoundExcelSheet)

//cvSharedHistoryExcel
const cvSharedHistoryExcel=require('../controllers/whiteCollar/excel/cVSharedHistoryExcel')
router.post('/whiteCollar/getCvSharedHistoryExcel',middleWare.auth,cvSharedHistoryExcel.getCvsharedHistoryExcel)
router.post('/whiteCollar/getCvSharedHistoryExcelSheet',middleWare.auth,cvSharedHistoryExcel.getCvsharedHistoryExcelSheet)

//interviewQAListExcel
const interviewQAListExcel=require('../controllers/whiteCollar/excel/InterviewQAListExcel')
router.post('/whiteCollar/getInterviewQAListExcel',middleWare.auth,interviewQAListExcel.getInterviewQAListExcel)
router.post('/whiteCollar/getInterviewQAListExcelSheet',middleWare.auth,interviewQAListExcel.getInterviewQAListExcelSheet)

//qaSharedWithBranchExcel
const qaSharedWithBranchExcel=require('../controllers/whiteCollar/excel/qaSharedWithBranchExcel')
router.post('/whiteCollar/getQaSharedWithBranchExcel',middleWare.auth,qaSharedWithBranchExcel.getQaSharedWithBranchExcel)
router.post('/whiteCollar/getQaSharedWithBranchExcelSheet',middleWare.auth,qaSharedWithBranchExcel.getQaSharedWithBranchExcelSheet)

//qaSharedHistoryExcel
const qaSharedHistoryExcel=require('../controllers/whiteCollar/excel/qaSharedHistoryExcel')
router.post('/whiteCollar/getQaSharedHistoryExcel',middleWare.auth,qaSharedHistoryExcel.getQaSharedHistoryExcel)
router.post('/whiteCollar/getQaSharedHistoryExcelSheet',middleWare.auth,qaSharedHistoryExcel.getQaSharedHistoryExcelSheet)

//emailTemplateListExcel
const emailTemplateListExcel=require('../controllers/whiteCollar/excel/emailTemplateListExcel')
router.post('/whiteCollar/getEmailTemplateListExcel',middleWare.auth,emailTemplateListExcel.getEmailTemplateListExcel)
router.post('/whiteCollar/getEmailTemplateListExcelSheet',middleWare.auth,emailTemplateListExcel.getEmailTemplateListExcelSheet)

//manageTemplateExcel
const manageTemplateExcel=require('../controllers/whiteCollar/excel/manageTemplateExcel')
router.post('/whiteCollar/getManageTemplateExcel',middleWare.auth,manageTemplateExcel.getManageTemplateExcel)
router.post('/whiteCollar/getManageTemplateExcelSheet',middleWare.auth,manageTemplateExcel.getManageTemplateExcelSheet)


//templateHistoryExcel
const templateHistoryExcel=require('../controllers/whiteCollar/excel/templateHistoryExcel')
router.post('/whiteCollar/getTemplateHistoryExcel',middleWare.auth,templateHistoryExcel.getTemplateHistoryExcel)
router.post('/whiteCollar/getTemplateHistoryExcelSheet',middleWare.auth,templateHistoryExcel.getTemplateHistoryExcelSheet)


//employeeBranchTransferHistoryExcel
const employeeBranchTransferHistoryExcel=require('../controllers/whiteCollar/excel/employeeBranchTransferHistoryExcel')
router.post('/whiteCollar/getEmployeeBranchTransferHistoryExcel',middleWare.auth,employeeBranchTransferHistoryExcel.getEmployeeBranchTransferHistoryExcel)
router.post('/whiteCollar/getEmployeeBranchTransferHistoryExcelSheet',middleWare.auth,employeeBranchTransferHistoryExcel.getEmployeeBranchTransferHistoryExcelSheet)

//offerLetterHistoryExcel
const offerLetterHistoryExcel=require('../controllers/whiteCollar/excel/offerLetterHistoryExcel')
router.post('/whiteCollar/getOfferLetterHistoryExcel',middleWare.auth,offerLetterHistoryExcel.getOfferLetterHistoryExcel)
router.post('/whiteCollar/getOfferLetterHistoryExcelSheet',middleWare.auth,offerLetterHistoryExcel.getOfferLetterHistoryExcelSheet)

//promotionLetterExcel
const promotionLetterExcel=require('../controllers/whiteCollar/excel/promotionLetterExcel')
router.post('/whiteCollar/getPromotionLetterExcel',middleWare.auth,promotionLetterExcel.getPromotionLetterExcel)
router.post('/whiteCollar/getPromotionLetterExcelSheet',middleWare.auth,promotionLetterExcel.getPromotionLetterExcelSheet)

//handoverChecklistExcel
const handoverChecklistExcel=require('../controllers/whiteCollar/excel/handoverChecklistExcel')
router.post('/whiteCollar/getHandoverChecklistExcel',middleWare.auth,handoverChecklistExcel.getHandoverChecklistExcel)
router.post('/whiteCollar/getHandoverChecklistExcelSheet',middleWare.auth,handoverChecklistExcel.getHandoverChecklistExcelSheet)

//appointmentLetterExcel
const appointmentLetterExcel=require('../controllers/whiteCollar/excel/appointmentLetterExcel')
router.post('/whiteCollar/getAppointmentLetterExcel',middleWare.auth,appointmentLetterExcel.getAppointmentLetterExcel)
router.post('/whiteCollar/getAppointmentLetterExcelSheet',middleWare.auth,appointmentLetterExcel.getAppointmentLetterExcelSheet)

//welcomeLetterExcel
const welcomeLetterExcel=require('../controllers/whiteCollar/excel/welcomeLetterExcel')
router.post('/whiteCollar/getWelcomeLetterExcel',middleWare.auth,welcomeLetterExcel.getWelcomeLetterExcel)
router.post('/whiteCollar/getWelcomeLetterExcelSheet',middleWare.auth,welcomeLetterExcel.getWelcomeLetterExcelSheet)

//confidentialityAgreementLetterExcel
const confidentialityAgreementLetterExcel=require('../controllers/whiteCollar/excel/confidentialityAgreementLetterExcel')
router.post('/whiteCollar/getConfidentialityAgreementLetterExcel',middleWare.auth,confidentialityAgreementLetterExcel.getConfidentialityAgreementLetterExcel)
router.post('/whiteCollar/getConfidentialityAgreementLetterExcelSheet',middleWare.auth,confidentialityAgreementLetterExcel.getConfidentialityAgreementLetterExcelSheet)

//antiLiabilityLetterExcel
const antiLiabilityLetterExcel=require('../controllers/whiteCollar/excel/antiLiabilityLetterExcel')
router.post('/whiteCollar/getAntiLiabilityLetterExcel',middleWare.auth,antiLiabilityLetterExcel.getAntiLiabilityLetterExcel)
router.post('/whiteCollar/getAntiLiabilityLetterExcelSheet',middleWare.auth,antiLiabilityLetterExcel.getAntiLiabilityLetterExcelSheet)

//trainningExtensionLetterExcel
const trainningExtensionLetterExcel=require('../controllers/whiteCollar/excel/trainningExtensionLetterExcel')
router.post('/whiteCollar/getTrainningExtensionLetterExcel',middleWare.auth,trainningExtensionLetterExcel.getTrainningExtensionLetterExcel)
router.post('/whiteCollar/getTrainningExtensionLetterExcelSheet',middleWare.auth,trainningExtensionLetterExcel.getTrainningExtensionLetterExcelSheet)

//letterOfIntentExcel
const letterOfIntentExcel=require('../controllers/whiteCollar/excel/letterOfIntentExcel')
router.post('/whiteCollar/getLetterOfIntentExcel',middleWare.auth,letterOfIntentExcel.getLetterOfIntentExcel)
router.post('/whiteCollar/getLetterOfIntentExcelSheet',middleWare.auth,letterOfIntentExcel.getLetterOfIntentExcelSheet)

//incrementLetterExcel
const incrementLetterExcel=require('../controllers/whiteCollar/excel/incrementLetterExcel')
router.post('/whiteCollar/getIncrementLetterExcel',middleWare.auth,incrementLetterExcel.getIncrementLetterExcel)
router.post('/whiteCollar/getIncrementLetterExcelSheet',middleWare.auth,incrementLetterExcel.getIncrementLetterExcelSheet)

//warningLetterExcel
const warningLetterExcel=require('../controllers/whiteCollar/excel/warningLetterExcel')
router.post('/whiteCollar/getWarningLetterExcel',middleWare.auth,warningLetterExcel.getWarningLetterExcel)
router.post('/whiteCollar/getWarningLetterExcelSheet',middleWare.auth,warningLetterExcel.getWarningLetterExcelSheet)


//showcauseLetterExcel
const showcauseLetterExcel=require('../controllers/whiteCollar/excel/showcauseLetterExcel')
router.post('/whiteCollar/getShowcauseLetterExcel',middleWare.auth,showcauseLetterExcel.getShowcauseLetterExcel)
router.post('/whiteCollar/getShowcauseLetterExcelSheet',middleWare.auth,showcauseLetterExcel.getShowcauseLetterExcelSheet)

//resignationLetterExcel
const resignationLetterExcel=require('../controllers/whiteCollar/excel/resignationLetterExcel')
router.post('/whiteCollar/getResignationLetterExcel',middleWare.auth,resignationLetterExcel.getResignationLetterExcel)
router.post('/whiteCollar/getResignationLetterExcelSheet',middleWare.auth,resignationLetterExcel.getResignationLetterExcelSheet)

//probationLetterExcel
const probationLetterExcel=require('../controllers/whiteCollar/excel/probationLetterExcel')
router.post('/whiteCollar/getProbationLetterExcel',middleWare.auth,probationLetterExcel.getProbationLetterExcel)
router.post('/whiteCollar/getProbationLetterExcelSheet',middleWare.auth,probationLetterExcel.getProbationLetterExcelSheet)


//probationExtensionLetterExcel
const probationExtensionLetterExcel=require('../controllers/whiteCollar/excel/probationExtensionLetterExcel')
router.post('/whiteCollar/getProbationExtensionLetterExcel',middleWare.auth,probationExtensionLetterExcel.getProbationExtensionLetterExcel)
router.post('/whiteCollar/getProbationExtensionLetterExcelSheet',middleWare.auth,probationExtensionLetterExcel.getProbationExtensionLetterExcelSheet)

//terminationLetterExcel
const terminationLetterExcel=require('../controllers/whiteCollar/excel/terminationLetterExcel')
router.post('/whiteCollar/getTerminationLetterExcel',middleWare.auth,terminationLetterExcel.getTerminationLetterExcel)
router.post('/whiteCollar/getTerminationLetterExcelSheet',middleWare.auth,terminationLetterExcel.getTerminationLetterExcelSheet)

//releaseLetterExcel
const releaseLetterExcel=require('../controllers/whiteCollar/excel/releaseLetterExcel')
router.post('/whiteCollar/getReleaseLetterExcel',middleWare.auth,releaseLetterExcel.getReleaseLetterExcel)
router.post('/whiteCollar/getReleaseLetterExcelSheet',middleWare.auth,releaseLetterExcel.getReleaseLetterExcelSheet)

//myAttendanceExcel
const myAttendanceExcel=require('../controllers/whiteCollar/excel/myAttendanceExcel')
router.post('/whiteCollar/getMyAttendanceExcel',middleWare.auth,myAttendanceExcel.getMyAttendanceExcel)
router.post('/whiteCollar/getMyAttendanceExcelSheet',middleWare.auth,myAttendanceExcel.getMyAttendanceExcelSheet)

//myLeaveExcel
const myLeaveExcel=require('../controllers/whiteCollar/excel/myLeaveExcel')
router.post('/whiteCollar/getMyLeaveExcel',middleWare.auth,myLeaveExcel.getMyLeaveExcel)
router.post('/whiteCollar/getMyLeaveExcelSheet',middleWare.auth,myLeaveExcel.getMyLeaveExcelSheet)

//MyHalfDayExcel
const myHalfDayExcel=require('../controllers/whiteCollar/excel/myHalfDayExcel')
router.post('/whiteCollar/getMyHalfDayExcel',middleWare.auth,myHalfDayExcel.getMyHalfDayExcel)
router.post('/whiteCollar/getMyHalfDayExcelSheet',middleWare.auth,myHalfDayExcel.getMyHalfDayExcelSheet)

//myCompOffLeaveExcel
const myCompOffLeaveExcel=require('../controllers/whiteCollar/excel/myCompOffLeaveExcel')
router.post('/whiteCollar/getMyCompOffLeaveExcel',middleWare.auth,myCompOffLeaveExcel.getMyCompOffLeaveExcel)
router.post('/whiteCollar/getMyCompOffLeaveExcelSheet',middleWare.auth,myCompOffLeaveExcel.getMyCompOffLeaveExcelSheet)

//myAdvanceExcel
const myAdvanceExcel=require('../controllers/whiteCollar/excel/myAdvanceExcel')
router.post('/whiteCollar/getMyAdvanceExcel',middleWare.auth,myAdvanceExcel.getMyAdvanceExcel)
router.post('/whiteCollar/getMyAdvanceExcelSheet',middleWare.auth,myAdvanceExcel.getMyAdvanceExcelSheet)

//myRoasterListExcel
const myRoasterListExcel=require('../controllers/whiteCollar/excel/myRoasterListExcel')
router.post('/whiteCollar/getMyRoasterListExcel',middleWare.auth,myRoasterListExcel.getMyRoasterListExcel)
router.post('/whiteCollar/getMyRoasterListExcelSheet',middleWare.auth,myRoasterListExcel.getMyRoasterListExcelSheet)

//myAllocatedAssetsHistoryExcel
const myAllocatedAssetsHistoryExcel=require('../controllers/whiteCollar/excel/myAllocatedAssetsHistoryExcel')
router.post('/whiteCollar/getMyAllocatedAssetsHistoryExcel',middleWare.auth,myAllocatedAssetsHistoryExcel.getMyAllocatedAssetsHistoryExcel)
router.post('/whiteCollar/getMyAllocatedAssetsHistoryExcelSheet',middleWare.auth,myAllocatedAssetsHistoryExcel.getMyAllocatedAssetsHistoryExcelSheet)

//myAllocatedAssetsExcel
const myAllocatedAssetsExcel=require('../controllers/whiteCollar/excel/myAllocatedAssetsExcel')
router.post('/whiteCollar/getMyAllocatedAssetsExcel',middleWare.auth,myAllocatedAssetsExcel.getMyAllocatedAssetsExcel)
router.post('/whiteCollar/getMyAllocatedAssetsExcelSheet',middleWare.auth,myAllocatedAssetsExcel.getMyAllocatedAssetsExcelSheet)

//myReturnedAssetListExcel
const myReturnedAssetListExcel=require('../controllers/whiteCollar/excel/myReturnedAssetsListExcel')
router.post('/whiteCollar/getMyReturnedAssetListExcel',middleWare.auth,myReturnedAssetListExcel.getMyReturnedAssetsListExcel)
router.post('/whiteCollar/getMyReturnedAssetListExcelSheet',middleWare.auth,myReturnedAssetListExcel.getMyReturnedAssetsListExcelSheet)

//myTaxDeclaration
const myTaxDeclarationExcel=require('../controllers/whiteCollar/excel/myTaxDeclarationExcel')
router.post('/whiteCollar/getMyTaxDeclarationExcel',middleWare.auth,myTaxDeclarationExcel.getMyTaxDeclarationExcel)
router.post('/whiteCollar/getMyTaxDeclarationExcelSheet',middleWare.auth,myTaxDeclarationExcel.getMyTaxDeclarationExcelSheet)

//myTdsLedgerExcel
const myTdsLedgerExcel=require('../controllers/whiteCollar/excel/myTdsLedgerExcel')
router.post('/whiteCollar/getMyTdsLedgerExcel',middleWare.auth,myTdsLedgerExcel.getMyTdsLedgerExcel)
router.post('/whiteCollar/getMyTdsLedgerExcelSheet',middleWare.auth,myTdsLedgerExcel.getMyTdsLedgerExcelSheet)

//myResignationExcel
const myResignationExcel=require('../controllers/whiteCollar/excel/myResignationExcel')
router.post('/whiteCollar/getMyResignationExcel',middleWare.auth,myResignationExcel.getMyResignationExcel)
router.post('/whiteCollar/getMyResignationExcelSheet',middleWare.auth,myResignationExcel.getMyResignationExcelSheet)


//myTdsExcel
const myTdsExcel=require('../controllers/whiteCollar/excel/myTdsExcel')
router.post('/whiteCollar/getMyTdsExcel',middleWare.auth,myTdsExcel.getMyTdsExcel)
router.post('/whiteCollar/getMyTdsExcelSheet',middleWare.auth,myTdsExcel.getMyTdsExcelSheet)

//myPfLedgerExcel
const myPfLedgerExcel=require('../controllers/whiteCollar/excel/myPfLedgerExcel')
router.post('/whiteCollar/getMyPfLedgerExcel',middleWare.auth,myPfLedgerExcel.getMyPfLedgerExcel)
router.post('/whiteCollar/getMyPfLedgerExcelSheet',middleWare.auth,myPfLedgerExcel.getMyPfLedgerExcelSheet)

//myPayslipExcel
const myPayslipExcel=require('../controllers/whiteCollar/excel/myPayslipExcel')
router.post('/whiteCollar/getMyPayslipExcel',middleWare.auth,myPayslipExcel.getMyPayslipExcel)
router.post('/whiteCollar/getMyPayslipExcelSheet',middleWare.auth,myPayslipExcel.getMyPayslipExcelSheet)

//compOffLeaveExcel
const compOffLeaveExcel=require('../controllers/whiteCollar/excel/compOffLeaveExcel')
router.post('/whiteCollar/getCompOffLeaveExcel',middleWare.auth,compOffLeaveExcel.getCompOffLeaveExcel)
router.post('/whiteCollar/getCompOffLeaveExcelSheet',middleWare.auth,compOffLeaveExcel.getCompOffLeaveExcelSheet)

//travelAllowanceExcel
const travelAllowanceExcel=require('../controllers/whiteCollar/excel/travelAllowanceExcel')
router.post('/whiteCollar/getTravelAllowanceExcel',middleWare.auth,travelAllowanceExcel.getTravelAllowanceExcel)
router.post('/whiteCollar/getTravelAllowanceExcelSheet',middleWare.auth,travelAllowanceExcel.getTravelAllowanceExcelSheet)

//overtimeReportsHrWcExcel
const overtimeReportsHrWcExcel=require('../controllers/whiteCollar/excel/overtimeReportsHrWcExcel')
router.post('/whiteCollar/getOvertimeReportsHrWcExcel',middleWare.auth,overtimeReportsHrWcExcel.getOvertimeReportsHrWcExcel)

//paidReimbursementExcel
const paidReimbursementExcel=require('../controllers/whiteCollar/excel/paidReimbursmentExcel')
router.post('/whiteCollar/getPaidReimbursementExcel',middleWare.auth,paidReimbursementExcel.getPaidReimbursmentExcel)
router.post('/whiteCollar/getPaidReimbursementExcelSheet',middleWare.auth,paidReimbursementExcel.getPaidReimbursmentExcelSheet)

//monthlyAttendanceReportExcel
const monthlyAttendanceReportExcel=require('../controllers/whiteCollar/excel/monthlyAttendanceReportExcel')
router.post('/whiteCollar/getMonthlyAttendanceReportExcel',middleWare.auth,monthlyAttendanceReportExcel.getMonthlyAttendanceReportExcel)
router.post('/whiteCollar/getMonthlyAttendanceReportExcelSheet',middleWare.auth,monthlyAttendanceReportExcel.getMonthlyAttendanceReportExcelSheet)

//customComponentReports
const customComponentReports=require('../controllers/whiteCollar/api/customComponentReports')
router.post('/whiteCollar/getCustomComponentReports',middleWare.auth,customComponentReports.getCustomComponentReports)
//customComponentReportsExcel
const customComponentReportsExcel=require('../controllers/whiteCollar/excel/customComponentReportsExcel')
router.post('/whiteCollar/getCustomComponentReportsExcel',middleWare.auth,customComponentReportsExcel.getCustomComponentReportsExcel)

//myKycExcel
const myKycExcel=require('../controllers/whiteCollar/excel/myKycExcel')
router.post('/whiteCollar/getMyKycExcel',middleWare.auth,myKycExcel.getMykycExcel)
router.post('/whiteCollar/getMyKycExcelSheet',middleWare.auth,myKycExcel.getMykycExcelSheet)

//monthlyAttendanceReportDateWise
const monthlyAttendanceReportDateWise=require('../controllers/whiteCollar/api/monthlyAttendanceReportDateWise')
router.post('/whiteCollar/getMonthlyAttendanceReportDateWise',middleWare.auth,monthlyAttendanceReportDateWise.getMonthlyAttendanceReportDateWise)
//monthlyAttendanceReportDateWiseExcel
const monthlyAttendanceReportDateWiseExcel=require('../controllers/whiteCollar/excel/monthlyAttendanceReportDateWiseExcel')
router.post('/whiteCollar/getMonthlyAttendanceReportDateWiseExcel',middleWare.auth,monthlyAttendanceReportDateWiseExcel.getMonthlyAttendanceReportDateWiseExcel)

//Custom Component Reports drop down
const customComponentDropDown=require('../controllers/whiteCollar/api/customComponentDropDown')
router.post('/whiteCollar/getCustomComponentDropDown',middleWare.auth,customComponentDropDown.getCustomComponentDropDown)







//                                                       Wages

//PayoutExcel
const payout=require('../controllers/salaryWages/api/payout')
router.post('/paybles/payout',middleWare.auth,payout.getPayout)

//wagesReportsListing
const wagesReportsListing=require('../controllers/salaryWages/api/wagesReportsListing')
router.post('/wages/getWagesReportsListing',middleWare.auth,wagesReportsListing.getWagesReportsListing)

// pfReportExcel
const pfReportWagesExcel=require('../controllers/salaryWages/excel/pfReportExcel')
router.post('/wages/pfReportExcel',middleWare.auth,pfReportWagesExcel.getPfReportExcel)  

//vpfReportExcel
const vpfReportWagesExcel=require('../controllers/salaryWages/excel/vpfReportExcel')
router.post('/wages/getVpfReportExcel',middleWare.auth,vpfReportWagesExcel.getVpfReportExcel)

//esiReportExcel
const esicReportWagesExcel=require('../controllers/salaryWages/excel/esicReportExcel')
router.post('/wages/getEsiReportExcel',middleWare.auth,esicReportWagesExcel.getEsicReportExcel)

//bonusReportExcel
const bonusReportWagesExcel=require('../controllers/salaryWages/excel/bonusReportExcel')
router.post('/wages/getBonusReportExcel',middleWare.auth,bonusReportWagesExcel.getBonusReportExcel)

//advanceReportExcel
const advanceReportWagesExcel=require('../controllers/salaryWages/excel/advanceReportExcel')
router.post('/wages/getAdvanceReportExcel',middleWare.auth,advanceReportWagesExcel.getAdvanceReportExcel)

//deactivateWagesReports
const deactivateWagesReports=require('../controllers/salaryWages/api/deactivateWagesReports')
router.post('/wages/putDeactivateWagesReports',middleWare.auth,deactivateWagesReports.putDeactivateWagesReports)

//overtimeReportExcel
const overtimeReportWagesExcel=require('../controllers/salaryWages/excel/overtimeReportExcel')
router.post('/wages/getOvertimeReportExcel',middleWare.auth,overtimeReportWagesExcel.getOvertimeReportExcel)

//ctcReportExcel
const ctcReportWagesExcel=require('../controllers/salaryWages/excel/ctcReportExcel')
router.post('/wages/getCtcReportExcel',middleWare.auth,ctcReportWagesExcel.getCtcReportExcel)

//ptaxReportExcel
const ptaxReportWagesExcel=require('../controllers/salaryWages/excel/ptaxReportExcel')
router.post('/wages/getPtaxReportExcel',middleWare.auth,ptaxReportWagesExcel.getPtaxReportExcel)

//payableReportExcel
const payableReportWagesExcel=require('../controllers/salaryWages/excel/payableReportExcel')
router.post('/wages/getPayableReportExcel',middleWare.auth,payableReportWagesExcel.getPayableReportExcel)

//payoutGenerationExcel
const payoutGenerationExcel=require('../controllers/salaryWages/excel/payoutGenerationExcel')
router.post('/wages/getPayoutGenerationExcel',middleWare.auth,payoutGenerationExcel.getPayoutGenerationExcel)
router.post('/wages/getPayoutGenerationExcelSheet',middleWare.auth,payoutGenerationExcel.getPayoutGenerationExcelSheet)

//payableMonthlyWagesExcel
const payableWagesExcel=require('../controllers/salaryWages/excel/payableMonthlyWagesExcel')
router.post('/wages/getPayableWagesExcel',middleWare.auth,payableWagesExcel.getPayableMonthlyWagesExcel)


//subcompanyWiseTemplateList
const subcompanyWiseTemplateList=require('../controllers/salaryWages/api/subcompanyWiseTemplateList')
router.post('/wages/getSubcompanyWiseTemplateList',middleWare.auth,subcompanyWiseTemplateList.getSubcompanyWiseTemplateList)

//approveSupervisorExcel
const approveSupervisorExcel=require('../controllers/salaryWages/excel/approveSupervisiorExcel')
router.post('/wages/getApproveSupervisorExcel',middleWare.auth,approveSupervisorExcel.getApproveSupervisorExcel)

//approveTemplateHrExcel
const approveTemplateHrExcel=require('../controllers/salaryWages/excel/approveTemplateHrExcel')
router.post('/wages/getApproveTemplateHrExcel',middleWare.auth,approveTemplateHrExcel.getApproveTemplateHrExcel)


//allTemplateApproveHrExcel
const allTemplateApproveHrExcel=require('../controllers/salaryWages/excel/allTemplateApproveHrExcel')
router.get('/wages/getAllTemplateApproveHrExcel',allTemplateApproveHrExcel.getAllTemplateApproveHrExcel)

//allReportsListing
const allReportsListing=require('../controllers/salaryWages/api/allReportsListing')
router.post('/wages/getAllReportsListing',allReportsListing.getAllReportsListing)

//attritionReportExcelWages
const attritionReportExcelWages=require('../controllers/salaryWages/excel/attritionReportExcelWages')
router.post('/wages/getAttritionReportExcelWages',middleWare.auth,attritionReportExcelWages.getAttritionReportExcelWages)
// router.post('/wages/getAttritionReportExcelWagesSheet',middleWare.auth,attritionReportExcelWages.getAttritionReportExcelWagesSheet)

//gratuityReportWages
const gratuityReportWages=require('../controllers/salaryWages/api/gratuityReport')
router.post('/wages/getGratuityReportWages',middleWare.auth,gratuityReportWages.getGratuityReport)

//gratuityReportWagesExcel
const gratuityReportWagesExcel=require('../controllers/salaryWages/excel/gratuityReportExcel')
router.get('/wages/getGratuityReportWagesExcel',gratuityReportWagesExcel.getGratuityReportWagesExcel)

//empProfileReportWagesExcel
const empProfileReportWagesExcel=require('../controllers/salaryWages/excel/empProfileReportWagesExcel')
router.post('/wages/getEmpProfileReportWagesExcel',empProfileReportWagesExcel.getEmpProfileReportWagesExcel)

//leaveReportsWagesExcel
const leaveReportsWagesExcel=require('../controllers/salaryWages/excel/leaveReportsWagesExcel')
router.post('/wages/getLeaveReportsWagesExcel',middleWare.auth,leaveReportsWagesExcel.getLeaveReportsWagesExcel)


//leaveBalanceReportWagesExcel
const leaveBalanceReportWagesExcel=require('../controllers/salaryWages/excel/leaveBalanceReportWagesExcel')
router.post('/wages/getLeaveBalanceReportWagesExcel',middleWare.auth,leaveBalanceReportWagesExcel.getLeaveBalanceReportWagesExcel)

//leaveDeductionReportsWagesExcel
const leaveDeductionReportsWagesExcel=require('../controllers/salaryWages/excel/leaveDeductionReportsWagesExcel')
router.post('/wages/getLeaveDeductionReportsWagesExcel',middleWare.auth,leaveDeductionReportsWagesExcel.getLeaveDeductionReportsWagesExcel)

//incidentReportWagesExcel
const incidentReportWagesExcel=require('../controllers/salaryWages/excel/incidentReportWagesExcel')
router.post('/wages/getIncidentReportWagesExcel',middleWare.auth,incidentReportWagesExcel.getIncidentReportWagesExcel)

//lwfcontributionReportWagesExcel
const lwfcontributionReportWagesExcel=require('../controllers/salaryWages/excel/lwfContributionReportWagesExcel')
router.post('/wages/getLwfcontributionReportWagesExcel',middleWare.auth,lwfcontributionReportWagesExcel.getLwfcontributionReportWagesExcel)

//assetRequestWagesExcel
const assetRequestWagesExcel=require('../controllers/salaryWages/excel/assetRequestWagesExcel')
router.post('/wages/getAssetRequestWagesExcel',middleWare.auth,assetRequestWagesExcel.getAssetRequestWagesExcel)

//assetAllotmentWagesExcel
const assetAllotmentWagesExcel=require('../controllers/salaryWages/excel/assetAllotmentWagesExcel')
router.post('/wages/getAssetAllotmentWagesExcel',middleWare.auth,assetAllotmentWagesExcel.getAssetAllotmentWagesExcel)

//returnAssetWagesExcel
const returnAssetWagesExcel=require('../controllers/salaryWages/excel/returnAssetWagesExcel')
router.post('/wages/getReturnAssetWagesExcel',middleWare.auth,returnAssetWagesExcel.getReturnAssetWagesExcel)

//resignationWagesExcel
const resignationWagesExcel=require('../controllers/salaryWages/excel/resignationReportWagesExcel')
router.post('/wages/getResignationWagesExcel',middleWare.auth,resignationWagesExcel.getResignationWagesExcel)

//tdsReportWages
const tdsReportWages=require('../controllers/salaryWages/api/tdsReportWages')
router.post('/wages/getTdsReportWages',middleWare.auth,tdsReportWages.getTdsReportWages)
//tdsReportWagesExcel
const tdsReportWagesExcel=require('../controllers/salaryWages/excel/tdsReportWagesExcel')
router.post('/wages/getTdsReportWagesExcel',middleWare.auth,tdsReportWagesExcel.getTdsReportWagesExcel)








//                                            DashBoard
// /*************************************************************************************** */

//attendanceReport
const attendanceReport=require('../controllers/dashboard/attendanceReport')
router.post('/dashboard/getAttendanceReport',middleWare.auth,attendanceReport.getAttendanceReport)

//attendanceStatusReport
const attendanceStatusReport=require('../controllers/dashboard/attendanceStatusReport')
router.post('/dashboard/getAttendanceStatusReport',middleWare.auth,attendanceStatusReport.getAttendanceStatusReport)

//dropDownForDashboard
const dropDownForDashboard=require('../controllers/dashboard/dropDownForDashboard')
router.post('/dashboard/getFinancialYearDropDown',middleWare.auth,dropDownForDashboard.getFinancialYearDropDown)
router.post('/dashboard/getMonthsDropDown',middleWare.auth,dropDownForDashboard.getMonthsDropDown)
router.post('/dashboard/getSubcomapanyDropDown',middleWare.auth,dropDownForDashboard.getSubcomapanyDropDown)
router.post('/dashboard/getDepartmentDropDown',middleWare.auth,dropDownForDashboard.getDepartmentDropDown)


//genderDistribution
const genderDistribution=require('../controllers/dashboard/genderDistribution')
router.post('/dashboard/getGenderDistribution',middleWare.auth,genderDistribution.getGenderDistribution)

//employeeType
const employeeType=require('../controllers/dashboard/employeeType')
router.post('/dashboard/getEmployeeType',middleWare.auth,employeeType.getEmployeeType)

//contributions
const contributions=require('../controllers/dashboard/contributions')
router.post('/dashboard/getContributions',middleWare.auth,contributions.getContributions)

//salaryReleased
const salaryReleased=require('../controllers/dashboard/salaryReleased')
router.post('/dashboard/getSalaryReleased',middleWare.auth,salaryReleased.getSalaryReleased)


//overtimeSummary
const overtimeSummary=require('../controllers/dashboard/overtimeSummary')
router.post('/dashboard/getOvertimeSummary',middleWare.auth,overtimeSummary.getOvertimeSummary)

//upcomingLeaves
const upcomingLeaves=require('../controllers/dashboard/upcomingLeaves')
router.post('/dashboard/getUpcomingLeaves',middleWare.auth,upcomingLeaves.getUpcomingLeaves)

//incidents
const incidents=require('../controllers/dashboard/incidents')
router.post('/dashboard/getIncidents',middleWare.auth,incidents.getIncidents)

//fnf
const fnf=require('../controllers/dashboard/fnf')
router.post('/dashboard/getFnf',middleWare.auth,fnf.getFnf)


// ********************************************setting**************************************
//roasterListExcel
const roasterListExcel=require('../controllers/setting/excel/roasterListExcel')
router.post('/setting/getRoasterListExcel',middleWare.auth,roasterListExcel.getRoasterListExcel)

// const biometricAttendanceImport=require('../controllers/setting/api/biometricAttendanceImport')
// router.post('/setting/getBiometricAttendanceImport',middleWare.auth,biometricAttendanceImport.getBiometricAttendanceImport)
// router.post(
//   '/setting/getBiometricAttendanceImport',
//   middleWare.auth,
//   upload.single('excelFile'), // this must match the Postman key
//   biometricAttendanceImport.getBiometricAttendanceImport
// );







//                                              DataBase



router.get('/eve_acc_employee',getController.eve_acc_employee)

router.get('/eve_acc_department',getController.eve_acc_department)



router.get('/attendanceApproved', getController.eve_acc_employee_attendence_approved)



router.get('/fixedWeeklyHoliday', getController.eve_acc_company_fix_weekly_holiday)



router.get('/leaveType', getController.eve_acc_leave_type)



router.get('/empListCommonDropDown', empListCommonDropDownController.empListCommonDropDownController)



router.get('/eve_acc_employee_salary', getController.eve_acc_employee_salary)



router.get('/eve_acc_company_weekly_holiday', getController.eve_acc_company_weekly_holiday)



router.get('/eve_acc_set_monthly_salary_employee_wise', getController.eve_acc_set_monthly_salary_employee_wise)



router.get('/eve_acc_employee_overtime_approved', getController.eve_acc_employee_overtime_approved)



router.get('/getEmpAttendance', getController.eve_acc_employee_attendence)

router.get('/eve_acc_module_activation_master', getController.eve_acc_module_activation_master)

router.get('/eve_acc_extra_duty_encashment_calculation_setting', getController.eve_acc_extra_duty_encashment_calculation_setting)

router.get('/eve_acc_employee_payslip_preview', getController.eve_acc_employee_payslip_preview)



router.get('/eve_acc_blue_coller_employee_payslip_preview', getController.eve_acc_blue_coller_employee_payslip_preview)
router.get('/eve_incident_report', getController.eve_incident_report)
router.get('/eve_hrm_employee_asset_allotment_details', getController.eve_hrm_employee_asset_allotment_details)
router.get('/eve_hrm_employee_asset_return_details', getController.eve_hrm_employee_asset_return_details)
router.get('/eve_employee_resignation_list', getController.eve_employee_resignation_list)
router.get('/eve_hrm_template_master', getController.eve_hrm_template_master)
router.get('/eve_acc_custom_salary_set_payroll', getController.eve_acc_custom_salary_set_payroll)
router.get('/eve_blue_employee_tds_amount', getController.eve_blue_employee_tds_amount)
router.get('/eve_acc_leave_deduction_log', getController.eve_acc_leave_deduction_log)
router.get('/eve_hrm_employee_shift_master', getController.eve_hrm_employee_shift_master)







router.get('/', async (req, res) => {

    res.send('hello------------')

})











module.exports = router

























