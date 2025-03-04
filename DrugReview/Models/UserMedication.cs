using System.ComponentModel.DataAnnotations;

namespace DrugReview.Models
{
    public class UserMedication
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        public virtual ApplicationUser User { get; set; } = null!;

        public int MedicationId { get; set; }
        public virtual Medication Medication { get; set; } = null!;

        [Required]
        public string Dosage { get; set; } = string.Empty;

        [Required]
        public string Frequency { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;
    }
}