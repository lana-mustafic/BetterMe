using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BetterMe.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSubtasksAndDependencies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentTaskId",
                table: "TodoTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TaskDependencies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaskId = table.Column<int>(type: "integer", nullable: false),
                    DependsOnTaskId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    DependencyType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "blocks")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskDependencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskDependencies_TodoTasks_DependsOnTaskId",
                        column: x => x.DependsOnTaskId,
                        principalTable: "TodoTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskDependencies_TodoTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "TodoTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TodoTasks_ParentTaskId",
                table: "TodoTasks",
                column: "ParentTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskDependencies_DependsOnTaskId",
                table: "TaskDependencies",
                column: "DependsOnTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskDependencies_TaskId",
                table: "TaskDependencies",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskDependencies_TaskId_DependsOnTaskId",
                table: "TaskDependencies",
                columns: new[] { "TaskId", "DependsOnTaskId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TodoTasks_TodoTasks_ParentTaskId",
                table: "TodoTasks",
                column: "ParentTaskId",
                principalTable: "TodoTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TodoTasks_TodoTasks_ParentTaskId",
                table: "TodoTasks");

            migrationBuilder.DropTable(
                name: "TaskDependencies");

            migrationBuilder.DropIndex(
                name: "IX_TodoTasks_ParentTaskId",
                table: "TodoTasks");

            migrationBuilder.DropColumn(
                name: "ParentTaskId",
                table: "TodoTasks");
        }
    }
}
