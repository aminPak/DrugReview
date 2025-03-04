using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace DrugReview.Models
{
    public class ApplicationUser : IdentityUser
    {
        [PersonalData]
        [StringLength(100)]
        public string? FirstName { get; set; }

        [PersonalData]
        [StringLength(100)]
        public string? LastName { get; set; }

        [PersonalData]
        public DateTime? DateOfBirth { get; set; }

        [PersonalData]
        [StringLength(500)]
        public string? HealthConditions { get; set; }

        [PersonalData]
        [StringLength(500)]
        public string? Allergies { get; set; }

        public virtual ICollection<UserMedication> UserMedications { get; set; } = new List<UserMedication>();
        public virtual ICollection<LabTest> LabTests { get; set; } = new List<LabTest>();
    }
}