using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetterMe.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMyDayFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AddedToMyDayAt",
                table: "TodoTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsInMyDay",
                table: "TodoTasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddedToMyDayAt",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "IsInMyDay",
                table: "TodoTasks");
        }
    }
}
