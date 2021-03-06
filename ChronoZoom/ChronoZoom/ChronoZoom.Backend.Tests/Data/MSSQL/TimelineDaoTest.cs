﻿using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using ChronoZoom.Backend.Data;
using System.Collections;
using ChronoZoom.Backend.Entities;
using System.Collections.Generic;
using ChronoZoom.Backend.Data.MSSQL.Dao;
using ChronoZoom.Backend.Data.Interfaces;
using System.Transactions;
using Dapper;
using Dapper.Exceptions;
using ChronoZoom.Backend.Exceptions;

namespace ChronoZoom.Backend.Tests.Data.MSSQL
{
    [TestClass]
    public class TimelineDaoTest
    {
        [TestMethod]
        public void TimelineDao_Find_IntegrationTest()
        {
            // Arrange
            ITimelineDao target = new TimelineDao();

            // Act
            Timeline result = target.Find(1);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.Id);
        }

        [TestMethod]
        [ExpectedException(typeof(TimelineNotFoundException))]
        public void TimelineDao_Find_NotFoundException_IntegrationTest()
        {
            // Arrange
            ITimelineDao target = new TimelineDao();

            // Act
            Timeline result = target.Find(-1);
        }

        [TestMethod]
        public void TimelineDao_Add_IntegrationTest()
        {
            using (var scope = new TransactionScope())
            {
                // Arrange
                ITimelineDao target = new TimelineDao();

                // Act
                Timeline result = target.Add(new Timeline()
                {
                    BeginDate = 1900,
                    EndDate = 2000,
                    Title = "Test",
                    IsPublic = true,
                });

                // Assert
                Assert.IsTrue(result.Id != 0);
            }
        }

        [TestMethod]
        public void TimelineDao_Update_IntegrationTest()
        {
            using (var scope = new TransactionScope())
            {
                // Arrange
                ITimelineDao target = new TimelineDao();
                Timeline timeline;

                using (DatabaseContext context = new DatabaseContext())
                {
                    timeline = context.FirstOrDefault<Backend.Data.MSSQL.Entities.ContentItem, Timeline>("SELECT * FROM [dbo].[ContentItem] WHERE Id=@Id", new { Id = 1 });
                }

                // Act
                target.Update(timeline);
            }
        }

        [TestMethod]
        [ExpectedException(typeof(UpdateFailedException))]
        public void TimelineDao_Update_Exception_IntegrationTest()
        {
            using (var scope = new TransactionScope())
            {
                // Arrange
                ITimelineDao target = new TimelineDao();

                // Act
                target.Update(new Timeline());
            }
        }

        [TestMethod]
        [ExpectedException(typeof(UpdateFailedException))]
        public void TimelineDao_Update_TimestampChanged_IntegrationTest()
        {
            using (var scope = new TransactionScope())
            {
                // Arrange
                ITimelineDao target = new TimelineDao();
                Timeline Timeline;

                using (DatabaseContext context = new DatabaseContext())
                {
                    Timeline = context.FirstOrDefault<Backend.Data.MSSQL.Entities.ContentItem, Timeline>("SELECT * FROM [dbo].[ContentItem] WHERE Id=@Id", new { Id = 1 });
                }
                Timeline.Timestamp[0]++;

                // Act
                target.Update(Timeline);
            }
        }
    }
}