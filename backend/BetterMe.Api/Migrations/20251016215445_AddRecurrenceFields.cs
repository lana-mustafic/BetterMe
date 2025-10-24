using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetterMe.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurrenceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompletedInstancesJson",
                table: "TodoTasks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "TodoTasks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextDueDate",
                table: "TodoTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OriginalTaskId",
                table: "TodoTasks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceEndDate",
                table: "TodoTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceInterval",
                table: "TodoTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RecurrencePattern",
                table: "TodoTasks",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedInstancesJson",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "IsRecurring",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "NextDueDate",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "OriginalTaskId",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "RecurrenceEndDate",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "RecurrenceInterval",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "RecurrencePattern",
                table: "TodoTasks");
        }
    }
}
