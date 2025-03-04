using System.ComponentModel.DataAnnotations;

namespace DrugReview.Models
{
    public class LabTest
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        public virtual ApplicationUser User { get; set; } = null!;

        [Required]
        [StringLength(200)]
        public string TestName { get; set; } = string.Empty;

        public DateTime TestDate { get; set; }

        [StringLength(1000)]
        public string? Results { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [Required]
        [StringLength(255)]
        public string FilePath { get; set; } = string.Empty;

        public DateTime UploadDate { get; set; }
    }
}