// ใช้กับ input ที่มี attribute data-phone-input ทุกช่องทั้งเว็บ (สมัครสมาชิก, แก้ไขโปรไฟล์)
// พิมพ์ได้แต่ตัวเลข ตัดให้เหลือแค่ 10 หลักอัตโนมัติ กันผู้ใช้กรอกตัวอักษร/สัญลักษณ์/เกิน 10 หลัก
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-phone-input]').forEach(function (input) {
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 10);
    });
  });
});
