using DrugReview.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DrugReview.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<UserMedication> UserMedications { get; set; }
        public DbSet<LabTest> LabTests { get; set; }
        public DbSet<Supplement> Supplements { get; set; }
    }
}