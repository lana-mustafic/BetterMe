using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BetterMe.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLocationAndEmailFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnableEmailNotifications",
                table: "UserNotificationSettings");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "TaskReminders");

            migrationBuilder.DropColumn(
                name: "LocationName",
                table: "TaskReminders");

            migrationBuilder.DropColumn(
                name: "LocationRadius",
                table: "TaskReminders");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "TaskReminders");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnableEmailNotifications",
                table: "UserNotificationSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "TaskReminders",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationName",
                table: "TaskReminders",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationRadius",
                table: "TaskReminders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "TaskReminders",
                type: "double precision",
                nullable: true);
        }
    }
}
