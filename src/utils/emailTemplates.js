// --- 1. Leave Approved Template (නිවාඩු අනුමත කළ විට) ---
export const leaveApprovedTemplate = (employeeName, leaveDate, leaveType) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
      <div style="background-color: #2e7d32; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">Leave Approved ✅</h2>
      </div>
      <div style="padding: 30px; background-color: #ffffff; color: #333333;">
        <p style="font-size: 16px;">Dear <strong>${employeeName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Great news! Your recent leave application has been approved by the HR department.</p>
        <div style="background-color: #f1f8e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveType}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${leaveDate}</p>
        </div>
        <p style="font-size: 16px;">Enjoy your time off! If you have any pending tasks, please ensure a proper handover before your leave.</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777777;">
        <p style="margin: 0;">This is an automated message from the HR System. Do not reply.</p>
      </div>
    </div>
  `;
};

// --- 2. Leave Rejected Template (නිවාඩු ප්‍රතික්ෂේප කළ විට) ---
export const leaveRejectedTemplate = (
  employeeName,
  leaveDate,
  leaveType,
  rejectReason,
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
      <div style="background-color: #c62828; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">Leave Application Update ⚠️</h2>
      </div>
      <div style="padding: 30px; background-color: #ffffff; color: #333333;">
        <p style="font-size: 16px;">Dear <strong>${employeeName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">We regret to inform you that your recent leave application has been <strong>rejected</strong> due to operational requirements.</p>
        <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveType}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${leaveDate}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${rejectReason || "Please contact your manager for details."}</p>
        </div>
        <p style="font-size: 16px;">The deducted leave balance has been refunded to your account. Please speak with your reporting manager to reschedule your leave.</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777777;">
        <p style="margin: 0;">This is an automated message from the HR System. Do not reply.</p>
      </div>
    </div>
  `;
};

// --- 3. Late Attendance Warning Template (නිතර පරක්කු වන විට Warning එකක්) ---
export const lateWarningTemplate = (employeeName, date, lateMinutes) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
      <div style="background-color: #f57c00; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">Attendance Alert ⏱️</h2>
      </div>
      <div style="padding: 30px; background-color: #ffffff; color: #333333;">
        <p style="font-size: 16px;">Dear <strong>${employeeName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">This is a gentle reminder regarding your attendance. Our records show that you checked in late today.</p>
        <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Late By:</strong> <span style="color: red; font-weight: bold;">${lateMinutes} Minutes</span></p>
        </div>
        <p style="font-size: 16px;">Please note that accumulated late minutes will affect your monthly attendance bonus and may result in late penalties during payroll processing.</p>
        <p style="font-size: 16px;">We appreciate your cooperation in maintaining office hours.</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777777;">
        <p style="margin: 0;">This is an automated message from the HR System. Do not reply.</p>
      </div>
    </div>
  `;
};
