using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetterMe.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixHabitsTableCreation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create Habits table if it doesn't exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_catalog.pg_class c
                        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                        WHERE n.nspname = 'public' AND c.relname = 'Habits'
                    ) THEN
                        CREATE TABLE ""Habits"" (
                            ""Id"" uuid NOT NULL,
                            ""UserId"" integer NOT NULL,
                            ""Name"" character varying(100) NOT NULL,
                            ""Description"" character varying(500),
                            ""Frequency"" text NOT NULL DEFAULT 'daily',
                            ""Streak"" integer NOT NULL DEFAULT 0,
                            ""BestStreak"" integer NOT NULL DEFAULT 0,
                            ""CompletedDates"" text NOT NULL,
                            ""TargetCount"" integer NOT NULL DEFAULT 1,
                            ""CurrentCount"" integer NOT NULL DEFAULT 0,
                            ""Category"" text NOT NULL DEFAULT 'Health & Fitness',
                            ""Color"" text NOT NULL DEFAULT '#4ade80',
                            ""Icon"" text NOT NULL DEFAULT '✅',
                            ""Difficulty"" text NOT NULL DEFAULT 'easy',
                            ""Points"" integer NOT NULL DEFAULT 10,
                            ""IsActive"" boolean NOT NULL DEFAULT true,
                            ""ReminderTime"" text,
                            ""Tags"" text NOT NULL,
                            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                            ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                            CONSTRAINT ""PK_Habits"" PRIMARY KEY (""Id""),
                            CONSTRAINT ""FK_Habits_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                        );

                        CREATE INDEX ""IX_Habits_UserId"" ON ""Habits"" (""UserId"");
                    END IF;
                END $$;
            ");

            // Create HabitCompletions table if it doesn't exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_catalog.pg_class c
                        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                        WHERE n.nspname = 'public' AND c.relname = 'HabitCompletions'
                    ) THEN
                        CREATE TABLE ""HabitCompletions"" (
                            ""Id"" uuid NOT NULL,
                            ""HabitId"" uuid NOT NULL,
                            ""UserId"" integer NOT NULL,
                            ""CompletedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                            ""Notes"" character varying(500),
                            ""Mood"" text,
                            ""PointsEarned"" integer NOT NULL DEFAULT 0,
                            CONSTRAINT ""PK_HabitCompletions"" PRIMARY KEY (""Id""),
                            CONSTRAINT ""FK_HabitCompletions_Habits_HabitId"" FOREIGN KEY (""HabitId"") REFERENCES ""Habits"" (""Id"") ON DELETE CASCADE,
                            CONSTRAINT ""FK_HabitCompletions_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                        );

                        CREATE INDEX ""IX_HabitCompletions_CompletedAt"" ON ""HabitCompletions"" (""CompletedAt"");
                        CREATE INDEX ""IX_HabitCompletions_HabitId_UserId"" ON ""HabitCompletions"" (""HabitId"", ""UserId"");
                        CREATE INDEX ""IX_HabitCompletions_UserId"" ON ""HabitCompletions"" (""UserId"");
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // This migration is idempotent, so Down is a no-op
            // Tables will be dropped by the CreateHabitsTable migration if needed
        }
    }
}
