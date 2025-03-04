using System.ComponentModel.DataAnnotations;

namespace DrugReview.Models
{
    public class Medication
    {
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? SideEffects { get; set; }

        [StringLength(500)]
        public string? Interactions { get; set; }

        [StringLength(200)]
        public string? Category { get; set; }

        public virtual ICollection<UserMedication> UserMedications { get; set; } = new List<UserMedication>();
    }
}