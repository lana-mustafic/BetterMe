using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetterMe.Api.Migrations
{
    /// <inheritdoc />
    public partial class CreateHabitsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Habits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Frequency = table.Column<string>(type: "text", nullable: false, defaultValue: "daily"),
                    Streak = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    BestStreak = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CompletedDates = table.Column<string>(type: "text", nullable: false),
                    TargetCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CurrentCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Category = table.Column<string>(type: "text", nullable: false, defaultValue: "Health & Fitness"),
                    Color = table.Column<string>(type: "text", nullable: false, defaultValue: "#4ade80"),
                    Icon = table.Column<string>(type: "text", nullable: false, defaultValue: "✅"),
                    Difficulty = table.Column<string>(type: "text", nullable: false, defaultValue: "easy"),
                    Points = table.Column<int>(type: "integer", nullable: false, defaultValue: 10),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ReminderTime = table.Column<string>(type: "text", nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Habits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Habits_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HabitCompletions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HabitId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Mood = table.Column<string>(type: "text", nullable: true),
                    PointsEarned = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HabitCompletions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HabitCompletions_Habits_HabitId",
                        column: x => x.HabitId,
                        principalTable: "Habits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HabitCompletions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Habits_UserId",
                table: "Habits",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HabitCompletions_CompletedAt",
                table: "HabitCompletions",
                column: "CompletedAt");

            migrationBuilder.CreateIndex(
                name: "IX_HabitCompletions_HabitId_UserId",
                table: "HabitCompletions",
                columns: new[] { "HabitId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_HabitCompletions_UserId",
                table: "HabitCompletions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HabitCompletions");

            migrationBuilder.DropTable(
                name: "Habits");
        }
    }
}
